import { Application } from 'probot'
import { serverless } from '@chadfawcett/probot-serverless-now'

const bot = (app: Application) => {
  app.on('issues.edited', async (context) => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    await context.github.issues.createComment(issueComment)
  })
}

export = process.env.NODE_ENV === 'dev' ? bot : serverless(bot)