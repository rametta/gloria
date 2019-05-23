import { Application } from 'probot'
import { serverless } from '@chadfawcett/probot-serverless-now'
import { prTickets } from './prTickets'
import { postChecks } from './postChecks'

const bot = (app: Application) => {
  app.on(['pull_request.opened', 'pull_request.edited'], prTickets)
  app.on('check_run.completed', postChecks)
}

export = process.env.NODE_ENV === 'production' ? serverless(bot) : bot