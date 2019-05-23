import { Context } from 'probot'
import { Maybe, get, Just, Nothing } from 'pratica'
import { getConfig, Config } from './config';

// const title = get<string>(['payload', 'check_run', 'output', 'title'])
// const summary = get<string>(['payload', 'check_run', 'output', 'summary'])
// const conclusion = get<string>(['payload', 'check_run', 'conclusion'])
// const start = get<string>(['payload', 'check_run', 'started_at'])
// const end = get<string>(['payload', 'check_run', 'completed_at'])
// const extract = <T>(m: Maybe<T>) => m.cata({ Just: x => x, Nothing: () => 'N/A' })

const shouldComment = (cfg: Config): Maybe<Config> => cfg.POST_CHECKS
  ? Just(cfg)
  : Nothing

export const postChecks = (ctx: Context): Promise<any> =>
  getConfig(ctx)
    .then(cfg => {
      shouldComment(cfg)
        .cata({
          Just: x => {
            // const data = {
            //   title: extract(title(ctx)),
            //   summary: extract(summary(ctx)),
            //   conclusion: extract(conclusion(ctx)),
            //   start: extract(start(ctx)),
            //   end: extract(end(ctx)),
            // }
            
            // console.log(data)

            const comment = ctx.issue({ body: 'Check complete', number: Date.now() })
            console.log(comment, JSON.stringify(comment))
            return ctx.github.issues.createComment(comment)
          },
          Nothing: () => ctx.log('Not posting comment about complete check')
        })
    })