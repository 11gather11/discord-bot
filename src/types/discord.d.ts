import type {
  Collection,
  CommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js'

export interface Command {
  data: RESTPostAPIApplicationCommandsJSONBody
  execute: (interaction: CommandInteraction) => Promise<void>
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>
  }
}
