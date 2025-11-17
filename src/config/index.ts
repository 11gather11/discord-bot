import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// zodスキーマ定義
const servicesConfigSchema = z.object({
	twitch: z.object({
		channels: z.array(z.string()).min(0),
	}),
	youtube: z.object({
		channelIds: z.array(z.string()).min(0),
	}),
})

export type ServicesConfig = z.infer<typeof servicesConfigSchema>

/**
 * サービス設定を読み込む
 * @returns {ServicesConfig} サービス設定
 */
export const loadServicesConfig = (): ServicesConfig => {
	try {
		const configPath = join(import.meta.dir, 'services.json')
		const configData = readFileSync(configPath, 'utf-8')
		const parsed = JSON.parse(configData)
		return servicesConfigSchema.parse(parsed)
	} catch (error) {
		logger.error('設定ファイルの読み込みに失敗しました:', error as Error)
		throw new Error('設定ファイルの読み込みに失敗しました')
	}
}
