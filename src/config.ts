import { Context } from 'probot'

export interface Config {
  SET_TICKETS: boolean
  POST_CHECKS: boolean
  JIRA_LINK: string
  TICKET_PREFIX: string
}

const defaultConfig: Config = {
  SET_TICKETS: false,
  POST_CHECKS: false,
  JIRA_LINK: '',
  TICKET_PREFIX: ''
}

export const getConfig = (context: Context): Promise<Config> =>
  context.config('gloria.yml', defaultConfig)