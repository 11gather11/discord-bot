import fs from 'node:fs'
import path from 'node:path'

import { Client, Collection, Events, GatewayIntentBits, type Interaction } from 'discord.js'

import 'dotenv/config'

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
	client.once(Events.ClientReady, onClientReady)
	client.on(Events.InteractionCreate, onInteractionCreate)
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
			.filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
		// 各ファイルを読み込む
		for (const file of commandFiles) {
			// コマンドファイルのパス
			const filePath = path.join(commandsPath, file)
			// コマンド
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

const onClientReady = (c: Client) => {
	console.log(`ログイン成功: ${c.user?.tag}`)
}

// コマンドが実行されたとき
const onInteractionCreate = async (interaction: Interaction) => {
	// コマンド以外のイベントは無視
	if (!interaction.isCommand()) {
		return
	}
	// コマンドが存在するか確認
	const command = client.commands.get(interaction.commandName)
	// コマンドが存在しない場合は無視
	if (!command) {
		return
	}

	try {
		// コマンドを実行
		await command.execute(interaction)
	} catch (error) {
		// エラーが発生した場合はエラーを出力
		console.error(error)
		await interaction.reply({
			content: 'コマンドの実行中にエラーが発生しました',
			ephemeral: true,
		})
	}
}

initialize().catch(console.error)
