import { Context } from 'probot'
import { Just, Nothing, Maybe, get } from 'pratica'
import { getConfig, Config } from './config'

const getBody = get<string>(['payload', 'pull_request', 'body'])

const getTitle = get<string>(['payload', 'pull_request', 'title'])

const tableAnchor = (name: string) => (link: string) =>
  `<td><a title="${name}" target="_blank" href="${link}">${name.toUpperCase()}</a></td>`

const generateLink = (base: string) => (ticket: string) =>
  base.charAt(base.length - 1) === '/'
    ? base + ticket
    : base + '/' + ticket

const extractTickets = (jira: string) => (prefixs: string[]) => (title?: string) =>
  Maybe(title)
    .map(t => prefixs.map(prefix => Maybe(t.match(new RegExp(prefix + '-\\d+', 'gi')))))
    .map(matches => matches.filter(m => m.isJust()))
    .chain(matches => matches.length ? Just(matches) : Nothing)
    .map((matches: RegExpMatchArray[]) => matches.reduce((acc, tickets) => acc.concat(tickets.map(t => tableAnchor(t)(generateLink(jira)(t)))), []))

const isBot = (ctx: Context): Maybe<Context> => ctx.isBot
  ? Nothing
  : Just(ctx)

const getTickets = (config: Config) => (ctx: Context): Maybe<string[]> =>
  (config.SET_TICKETS && config.JIRA_LINK !== '' && config.TICKET_PREFIXS.length)
    ? getTitle(ctx).chain(title => extractTickets(config.JIRA_LINK)(config.TICKET_PREFIXS)(title))
    : Nothing

const joinTickets = (tickets: string[]) =>
  `<!--ticketstart-->
  #### :page_facing_up: Tickets
  <table><tr>
  ${tickets.join('')}
  </tr></table>
  <!--ticketend-->\n`

const shouldModifyTickets = (body: string) => (tickets: string[]): Maybe<string> =>
  Just(body.slice(body.indexOf('<!--ticketstart-->'), body.indexOf('<!--ticketend-->') + 16))
    .map(oldMiddle => ({
      oldMiddle,
      newMiddle: joinTickets(tickets)
    }))
    .chain(({ oldMiddle, newMiddle }) =>
      oldMiddle === newMiddle
        ? Nothing
        : modifyBodyTickets(body)(newMiddle)
    )

const modifyBodyTickets = (body: string) => (middle: string): Maybe<string> =>
  Just({
    before: body.slice(0, body.indexOf('<!--ticketstart-->')),
    after: body.slice(body.indexOf('<!--ticketend-->') + 16)
  })
  .map(({ before, after }) => before + middle + after)

const addTicketsToBody = (body: string) => (tickets: string[]): Maybe<string> =>
  Just(joinTickets(tickets) + body)

const shouldModifyBody = (ctx: Context) => (tickets: string[]): Maybe<string> =>
  getBody(ctx)
    .chain(body => body.indexOf('<!--ticketstart-->') === -1
      ? addTicketsToBody(body)(tickets)
      : shouldModifyTickets(body)(tickets)
    )

export const prTickets = (ctx: Context): Promise<void> => 
  getConfig(ctx)
    .then(config => {
      console.log(config)
      isBot(ctx)
        .chain(getTickets(config))
        .chain(shouldModifyBody(ctx))
        .cata({
          Just: body => ctx.github.pullRequests.update(ctx.issue({ body })),
          Nothing: () => ctx.log('PR Body not updated with tickets')
        })
    })