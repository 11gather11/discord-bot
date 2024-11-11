import fs from 'node:fs'
import path from 'node:path'
import { logger } from '@/helpers/logger'
import type { Client } from 'discord.js'

export default async (client: Client) => {
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
				logger.warn(`コマンドファイル ${file} に data または execute が見つかりません`)
			}
		}
	}
}
