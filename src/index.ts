import { Client, GatewayIntentBits } from 'discord.js'
import { loadCommands } from '@/handlers/commands'
import { loadEvents } from '@/handlers/events'

// 新しいClientインスタンスを作成
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
})

client.commands = await loadCommands()

await loadEvents(client)

client.login(import.meta.env.DISCORD_TOKEN)
