import type {
	ChatInputCommandInteraction,
	Collection,
	RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js'

interface Command {
	data: RESTPostAPIApplicationCommandsJSONBody
	execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
}

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>
	}
}
