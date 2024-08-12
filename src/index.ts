import fs from 'node:fs'
import path from 'node:path'

import { Client, Collection, GatewayIntentBits } from 'discord.js'

// 環境変数
const { DISCORD_TOKEN } = process.env

// 新しいClientインスタンスを作成
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
})

client.commands = new Collection()

//初期化
const initialize = async () => {
	await loadCommands()
	await loadEvents()
	await client.login(DISCORD_TOKEN)
}

// コマンドを読み込む
const loadCommands = async () => {
	// コマンドフォルダーのパス
	const foldersPath = path.join(__dirname, 'commands')
	// コマンドフォルダー内のフォルダーを取得
	const commandFolders = fs.readdirSync(foldersPath)
	// 各フォルダー内のコマンドファイルを読み込む
	for (const folder of commandFolders) {
		// コマンドフォルダー内のフォルダーのパス
		const commandsPath = path.join(foldersPath, folder)
		// コマンドフォルダー内のファイルを取得
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('_'))
		// 各ファイルを読み込む
		for (const file of commandFiles) {
			// コマンドファイルのパス
			const filePath = path.join(commandsPath, file)
			// コマンドをインポート
			const command = await import(filePath)
			// data と execute があるか確認
			if ('data' in command && 'execute' in command) {
				// コマンドをコレクションにセット
				client.commands.set(command.data.name, command)
			} else {
				// data または execute がない場合はエラーを出力
				console.error(`コマンドファイル ${file} に data または execute が見つかりません`)
			}
		}
	}
}

// イベントを読み込む
const loadEvents = async () => {
	// イベントフォルダーのパス
	const foldersPath = path.join(__dirname, 'events')
	// イベントフォルダー内のファイルを取得
	const eventFolders = fs.readdirSync(foldersPath)
	// 各フォルダー内のイベントファイルを読み込む
	for (const folder of eventFolders) {
		// イベントフォルダー内のフォルダーのパス
		const eventsPath = path.join(foldersPath, folder)
		// イベントフォルダー内のファイルを取得
		const eventFiles = fs
			.readdirSync(eventsPath)
			.filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('_'))
		// 各ファイルを読み込む
		for (const file of eventFiles) {
			// イベントファイルのパス
			const filePath = path.join(eventsPath, file)
			// イベントをインポート
			const event = await import(filePath)
			// name と execute があるか確認
			if ('name' in event && 'execute' in event) {
				// イベントを登録 (once が true の場合は once で登録)
				if (event.once) {
					client.once(event.name, (...args) => event.execute(...args))
				} else {
					client.on(event.name, (...args) => event.execute(...args))
				}
				// name と execute がない場合はエラーを出力
			} else {
				console.error(`イベントファイル ${file} に name または execute が見つかりません`)
			}
		}
	}
}

initialize().catch(console.error)
