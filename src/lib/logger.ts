import { WebhookClient } from 'discord.js'

/**
 * ログレベルの定義
 */
type LogLevel = 'error' | 'warn' | 'success' | 'info' | 'http' | 'debug'

/**
 * ANSIカラーの定義
 */
type Color = 'red' | 'yellow' | 'green' | 'blue' | 'magenta' | 'white'

/**
 * ログレベルごとの色マッピング
 */
const LEVEL_COLORS: Record<LogLevel, Color> = {
	error: 'red',
	warn: 'yellow',
	success: 'green',
	info: 'blue',
	http: 'magenta',
	debug: 'white',
}

/**
 * ANSIカラーコード
 */
const ANSI_COLORS: Record<Color | 'reset', string> = {
	red: '\u001b[31m',
	yellow: '\u001b[33m',
	green: '\u001b[32m',
	blue: '\u001b[34m',
	magenta: '\u001b[35m',
	white: '\u001b[37m',
	reset: '\u001b[0m',
}

/**
 * Webhook送信対象のログレベル
 */
const WEBHOOK_LEVELS: readonly LogLevel[] = ['error', 'warn', 'success', 'info'] as const

/**
 * テキストにANSI色を適用
 */
const colorize = (color: Color, text: string): string => {
	return `${ANSI_COLORS[color]}${text}${ANSI_COLORS.reset}`
}

/**
 * 日本時間でタイムスタンプを生成
 */
const getTimestamp = (): string => {
	return new Date().toLocaleString('ja-JP', {
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

/**
 * 引数を文字列に変換
 */
const formatArgs = (args: unknown[]): string => {
	return args
		.map((arg) => {
			if (typeof arg === 'string') return arg
			if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`
			try {
				return JSON.stringify(arg, null, 2)
			} catch {
				return String(arg)
			}
		})
		.join(' ')
}

/**
 * WebhookClientのインスタンス
 */
let webhookClient: WebhookClient | null = null

/**
 * Webhook初期化
 */
const initWebhook = (): void => {
	// 開発環境ではWebhookを無効化
	if (import.meta.env.NODE_ENV === 'development') {
		console.warn('[Webhook] 開発環境のため無効化されています')
		return
	}

	// 環境変数チェック
	const webhookUrl = import.meta.env.DISCORD_LOG_WEBHOOK_URL
	if (!webhookUrl) {
		console.warn('[Webhook] DISCORD_LOG_WEBHOOK_URL が設定されていません')
		return
	}

	// WebhookClient作成
	try {
		webhookClient = new WebhookClient({ url: webhookUrl })
	} catch (error) {
		console.error('[Webhook] 初期化に失敗しました:', (error as Error).message)
	}
}

/**
 * Webhookにログを送信
 */
const sendToWebhook = async (level: LogLevel, message: string): Promise<void> => {
	if (!webhookClient) return

	try {
		const timestamp = getTimestamp()
		const color = LEVEL_COLORS[level]
		const styledLevel = colorize(color, level.toUpperCase())

		await webhookClient.send({
			username: 'Bot Logger',
			content: `\`\`\`ansi\n[${timestamp}] [${styledLevel}]: ${message}\n\`\`\``,
		})
	} catch (error) {
		// 循環参照を避けるためconsole.errorを使用
		console.error('[Webhook] 送信に失敗しました:', (error as Error).message)
	}
}

/**
 * コンソールにログを出力
 */
const logToConsole = (level: LogLevel, message: string): void => {
	const timestamp = getTimestamp()
	const color = LEVEL_COLORS[level]
	const styledLevel = colorize(color, level.toUpperCase())
	console.log(`[${timestamp}] [${styledLevel}]: ${message}`)
}

/**
 * Logger API
 */
export const logger: Record<LogLevel, (...args: unknown[]) => void> = {
	error: (...args) => {
		const message = formatArgs(args)
		logToConsole('error', message)
		if (WEBHOOK_LEVELS.includes('error')) {
			sendToWebhook('error', message)
		}
	},
	warn: (...args) => {
		const message = formatArgs(args)
		logToConsole('warn', message)
		if (WEBHOOK_LEVELS.includes('warn')) {
			sendToWebhook('warn', message)
		}
	},
	success: (...args) => {
		const message = formatArgs(args)
		logToConsole('success', message)
		if (WEBHOOK_LEVELS.includes('success')) {
			sendToWebhook('success', message)
		}
	},
	info: (...args) => {
		const message = formatArgs(args)
		logToConsole('info', message)
		if (WEBHOOK_LEVELS.includes('info')) {
			sendToWebhook('info', message)
		}
	},
	http: (...args) => {
		const message = formatArgs(args)
		logToConsole('http', message)
	},
	debug: (...args) => {
		const message = formatArgs(args)
		logToConsole('debug', message)
	},
}

// Logger定義後にWebhookを初期化
initWebhook()
