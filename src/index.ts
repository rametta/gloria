import { Application } from 'probot'
import { serverless } from '@chadfawcett/probot-serverless-now'
import { prTickets } from './prTickets'

const bot = (app: Application) => {
  app.on(['pull_request.opened', 'pull_request.edited'], prTickets)
}

export = process.env.NODE_ENV === 'production' ? serverless(bot) : bot