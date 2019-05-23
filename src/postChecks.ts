import { Context } from 'probot'

export const postChecks = (ctx: Context): Promise<void> => {
  console.log(ctx.payload)
  return Promise.resolve()
}