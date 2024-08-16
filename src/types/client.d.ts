import type {
	Collection,
	CommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js'

interface Command {
	data: RESTPostAPIApplicationCommandsJSONBody
	execute: (interaction: CommandInteraction) => Promise<void> | void
}

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>
	}
}
