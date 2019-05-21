import { Context } from 'probot'
import { Just, Nothing, Maybe, get } from 'pratica'
import { getConfig, Config } from './config'

const getBody = get<string>(['payload', 'pull_request', 'body'])

const getTitle = get<string>(['payload', 'pull_request', 'title'])

const extractTickets = (jira: string) => (prefix: string) => (title?: string) =>
  Maybe(title)
    .chain(t => Maybe(t.match(new RegExp(prefix + '-\\d+', 'gi'))))
    .map(tickets => tickets.map(t => `* [${t}](${jira}${t})`))

const isBot = (ctx: Context): Maybe<Context> => ctx.isBot
  ? Just(ctx)
  : Nothing

const getTickets = (config: Config) => (ctx: Context): Maybe<string[]> =>
  (config.SET_TICKETS && config.JIRA_LINK !== '' && config.TICKET_PREFIX !== '')
    ? getTitle(ctx).chain(title => extractTickets(config.JIRA_LINK)(config.TICKET_PREFIX)(title))
    : Nothing

const joinTickets = (tickets: string[]) =>
  `<!--ticketstart-->#### 📃 Tickets\n${tickets.join('\n') + '\n'}<!--ticketend-->\n`

const shouldAddTickets = (ctx: Context) => (tickets: string[]): Maybe<string> =>
  getBody(ctx)
    .chain(body => body.indexOf('<!--ticketstart-->') === -1
      ? Just(joinTickets(tickets) + body)
      : Nothing
    )

const createBody = (ctx: Context) => (body: string) => ctx.issue({ body })

export const prTickets = (ctx: Context): Promise<void> =>
  getConfig(ctx)
    .then(config => {
      isBot(ctx)
        .chain(getTickets(config))
        .chain(shouldAddTickets(ctx))
        .cata({
          Just: body => ctx.github.pullRequests.update(createBody(ctx)(body)),
          Nothing: () => {}
        })
    })