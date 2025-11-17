import { Glob } from 'bun'
import { Collection } from 'discord.js'
import { logger } from '@/lib/logger'
import type { Command } from '@/types/command'

const isValidCommand = (cmd: unknown): cmd is Command => {
	if (!cmd || typeof cmd !== 'object') return false

	const command = cmd as Record<string, unknown>

	if (!command.command || typeof command.command !== 'object') return false
	if (!command.execute || typeof command.execute !== 'function') return false

	const commandData = command.command as Record<string, unknown>
	if (!commandData.name || typeof commandData.name !== 'string') return false
	if (!commandData.description || typeof commandData.description !== 'string') return false

	const nameRegex = /^[\w-]{1,32}$/
	if (!nameRegex.test(commandData.name as string)) {
		logger.warn(`コマンド名 "${commandData.name}" は1-32文字で、英数字、-、_のみ使用可能です`)
		return false
	}

	if ((commandData.description as string).length > 100) {
		logger.warn(`コマンド "${commandData.name}" の説明が100文字制限を超えています`)
		return false
	}

	if (command.autocomplete && typeof command.autocomplete !== 'function') return false
	if (command.modal && typeof command.modal !== 'function') return false
	if (command.button && typeof command.button !== 'function') return false

	return true
}

export const loadCommands = async (): Promise<Collection<string, Command>> => {
	const collection = new Collection<string, Command>()
	const glob = new Glob('*/index.{js,ts}')
	const dir = `${import.meta.dir}/../commands`

	const commandFiles = await Array.fromAsync(glob.scan(dir))

	const loadCommandPromises = commandFiles.map(async (file) => {
		try {
			const commandModule = await import(`${dir}/${file}`)
			const command = commandModule.default

			if (!command) {
				logger.error(`コマンドファイル ${file} がデフォルトコマンドをエクスポートしていません`)
				return { file, command: null, success: false }
			}

			return { file, command, success: true }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			logger.error(`コマンド ${file} の読み込みに失敗:`, errorMessage)
			return { file, command: null, success: false, error }
		}
	})

	const results = await Promise.allSettled(loadCommandPromises)

	const processedResults = results.map((result) => {
		if (result.status === 'fulfilled' && result.value.success) {
			const { file, command } = result.value

			if (!isValidCommand(command)) {
				logger.error(`無効なコマンド構造 ${file}:`, {
					hasCommand: !!command?.command,
					hasExecute: typeof command?.execute === 'function',
					commandName: command?.command?.name || 'unknown',
					hasValidName: typeof command?.command?.name === 'string',
					hasValidDescription: typeof command?.command?.description === 'string',
				})
				return { success: false, file, command: null, isDuplicate: false }
			}

			const commandName = command.command.name
			const isDuplicate = collection.has(commandName)

			if (isDuplicate) {
				logger.error(`重複コマンド名 "${commandName}" が ${file} で見つかりました`)
				return { success: false, file, command, isDuplicate: true, commandName }
			}

			return { success: true, file, command, commandName, isDuplicate: false }
		}

		return {
			success: false,
			file: 'unknown',
			command: null,
			isDuplicate: false,
		}
	})

	let loadedCount = 0
	let failedCount = 0
	const duplicateCommands: string[] = []

	processedResults.forEach((result) => {
		if (result.success && result.command && result.commandName) {
			collection.set(result.commandName, result.command)
			logger.log(`コマンドを読み込み: ${result.commandName}`)
			loadedCount++
		} else {
			failedCount++
			if (result.isDuplicate && result.commandName) {
				duplicateCommands.push(result.commandName)
			}
		}
	})

	logger.info(`コマンド読み込み完了: ${loadedCount}個読み込み、${failedCount}個失敗`)

	if (duplicateCommands.length > 0) {
		logger.warn(`重複コマンド名が見つかりました: ${duplicateCommands.join(', ')}`)
	}

	if (loadedCount === 0 && commandFiles.length > 0) {
		logger.warn('コマンドが正常に読み込まれませんでした。コマンドファイルの構造とエクスポートを確認してください。')
	}

	return collection
}
