import fs from 'node:fs'
import path from 'node:path'

import { type APIApplicationCommand, REST, Routes } from 'discord.js'
import type { Command } from './types/client'

// 環境変数
const { DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DISCORD_TOKEN } = process.env
if (!(DISCORD_CLIENT_ID && DISCORD_GUILD_ID && DISCORD_TOKEN)) {
	console.error('環境変数が設定されていません')
	process.exit(1)
}

export const deployCommands = async () => {
	const commands: Command[] = []

	const foldersPath = path.join(__dirname, 'commands')
	const commandFolders = fs.readdirSync(foldersPath)

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder)
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file)
			const command = await import(filePath)

			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON())
			} else {
				console.error(`コマンドファイル ${file} に data または execute が見つかりません`)
			}
		}
	}

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)
	;(async () => {
		try {
			const data = (await rest.put(
				Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
				{ body: commands }
			)) as APIApplicationCommand[]
			if (process.env.NODE_ENV === 'development') {
				console.log(`開発環境用 ${data.length} 個のアプリケーションコマンドを登録しました。`)
			} else {
				console.log(`本番環境用 ${data.length} 個のアプリケーションコマンドを登録しました。`)
			}
		} catch (error) {
			console.error(error)
		}
	})()
}
