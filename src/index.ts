import fs from 'node:fs'
import path from 'node:path'

import { Client, Collection, GatewayIntentBits, type TextBasedChannel } from 'discord.js'

// 環境変数
const { DISCORD_TOKEN, DISCORD_LOG_CHANNEL_ID } = process.env

if (!(DISCORD_TOKEN && DISCORD_LOG_CHANNEL_ID)) {
	throw new Error('環境変数が設定されていません')
}

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
client.commands = new Collection()

//初期化
const initialize = async () => {
	overrideConsole(client, DISCORD_LOG_CHANNEL_ID)
	try {
		await loadCommands()
		await loadEvents()
		await client.login(DISCORD_TOKEN)
	} catch (error) {
		console.error('初期化中にエラーが発生しました:', (error as Error).message)
		process.exit(1)
	}
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

// console.log と console.error をオーバーライドする関数
const overrideConsole = (client: Client, logChannelId?: string): void => {
	// ログチャンネルIDが指定されていない場合は処理を終了
	if (!logChannelId) {
		console.error('ログチャンネルIDが指定されていません')
		return
	}

	// 元の console.log を保存
	const originalConsoleLog = console.log
	// 元の console.error を保存
	const originalConsoleError = console.error

	// タイムスタンプを取得する関数
	const getTimestamp = (): string => {
		// 現在の日時を取得
		const now = new Date()
		// 日本時間に変換して、指定されたフォーマットで返す
		return now.toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		})
	}

	// console.log のオーバーライド
	console.log = async (...args: unknown[]): Promise<void> => {
		const timestamp = getTimestamp()
		// 元の console.log を呼び出してログをコンソールに出力
		originalConsoleLog.apply(console, [`[${timestamp}]`, ...args])
		try {
			// 指定されたチャンネルIDを使用してチャンネルを取得
			const channel = await client.channels.fetch(logChannelId)
			// チャンネルがテキストベースか確認し、ログ内容をチャンネルに送信
			if (channel?.isTextBased()) {
				await (channel as TextBasedChannel).send(`\`\`\`[${timestamp}] ${args.join(' ')}\`\`\``)
			}
		} catch (error) {
			// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
			originalConsoleLog('Failed to send log to channel:', error)
		}
	}

	// console.error のオーバーライド
	console.error = async (...args: unknown[]): Promise<void> => {
		const timestamp = getTimestamp()
		// 元の console.error を呼び出してエラーをコンソールに出力
		originalConsoleError.apply(console, [`[${timestamp}]`, ...args])
		try {
			// 指定されたチャンネルIDを使用してチャンネルを取得
			const channel = await client.channels.fetch(logChannelId)
			// チャンネルがテキストベースか確認し、エラー内容をチャンネルに送信
			if (channel?.isTextBased()) {
				await (channel as TextBasedChannel).send(
					`\`\`\`ansi\n\u001b[0;31m[${timestamp}] ${args.join(' ')}\`\`\``
				)
			}
		} catch (error) {
			// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
			originalConsoleError('Failed to send error to channel:', error)
		}
	}
}

initialize().catch(console.error)
