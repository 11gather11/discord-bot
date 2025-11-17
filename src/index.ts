import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Client, Collection, GatewayIntentBits } from 'discord.js'
import type { Command } from '@/types/command'

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

// コマンドを格納するコレクション
client.commands = new Collection<string, Command>()

const handlersDir = join(__dirname, './handlers')
for (const file of readdirSync(handlersDir)) {
	if (!(file.endsWith('.ts') || file.endsWith('.js'))) {
		continue
	}
	const { default: handler } = await import(join(handlersDir, file))
	handler(client)
}

client.login(import.meta.env.DISCORD_TOKEN)
