import { styleText } from 'node:util'
import { type Client, TextChannel } from 'discord.js'
// console.log と console.error をオーバーライドする関数
export const overrideConsole = async (
	client: Client,
	guildId: string,
	logChannelId: string
): Promise<void> => {
	// 元の console.log を保存
	const originalConsoleLog = console.log
	// 元の console.error を保存
	const originalConsoleError = console.error
	// 元の console.info を保存
	const originalConsoleInfo = console.info
	// 元の console.warn を保存
	const originalConsoleWarn = console.warn

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

	try {
		const guild = await client.guilds.fetch(guildId)
		const channel = await guild.channels.fetch(logChannelId)
		if (!channel) {
			throw new Error('ログチャンネルが見つかりません')
		}
		if (!(channel instanceof TextChannel)) {
			throw new Error('ログチャンネルがテキストチャンネルではありません')
		}
		// console.log のオーバーライド
		console.log = async (...args: unknown[]): Promise<void> => {
			const timestamp = getTimestamp()
			// 元の console.log を呼び出してログをコンソールに出力
			originalConsoleLog.apply(console, [`[${timestamp}]`, ...args])
			try {
				const consoleText = styleText('white', `[${timestamp}] ${args.join(' ')}`)
				await channel.send(`\`\`\`ansi\n${consoleText}\`\`\``)
			} catch (error) {
				// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
				originalConsoleLog('Discordへのログ送信に失敗しました:', error)
			}
		}

		// console.error のオーバーライド
		console.error = async (...args: unknown[]): Promise<void> => {
			const timestamp = getTimestamp()
			// 元の console.error を呼び出してエラーをコンソールに出力
			originalConsoleError.apply(console, [`[${timestamp}]`, ...args])
			try {
				const consoleText = styleText('red', `[${timestamp}] ${args.join(' ')}`)
				await channel.send(`@everyone\`\`\`ansi\n${consoleText}\`\`\``)
			} catch (error) {
				// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
				originalConsoleError('Discordへのエラー送信に失敗しました:', error)
			}
		}

		// console.info のオーバーライド
		console.info = async (...args: unknown[]): Promise<void> => {
			const timestamp = getTimestamp()
			// 元の console.info を呼び出して情報をコンソールに出力
			originalConsoleInfo.apply(console, [`[${timestamp}]`, ...args])
			try {
				const consoleText = styleText('green', `[${timestamp}] ${args.join(' ')}`)
				await channel.send(`\`\`\`ansi\n${consoleText}\`\`\``)
			} catch (error) {
				// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
				originalConsoleInfo('Discordへの情報送信に失敗しました:', error)
			}
		}

		// console.warn のオーバーライド
		console.warn = async (...args: unknown[]): Promise<void> => {
			const timestamp = getTimestamp()
			// 元の console.warn を呼び出して警告をコンソールに出力
			originalConsoleWarn.apply(console, [`[${timestamp}]`, ...args])
			try {
				const consoleText = styleText('yellow', `[${timestamp}] ${args.join(' ')}`)
				await channel.send(`\`\`\`ansi\n${consoleText}\`\`\``)
			} catch (error) {
				// チャンネルへの送信に失敗した場合、エラーメッセージをコンソールに出力
				originalConsoleWarn('Discordへの警告送信に失敗しました:', error)
			}
		}
	} catch (error) {
		originalConsoleError('Discordへのログ送信に失敗しました:', error)
	}
}
