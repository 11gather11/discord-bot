import type { Client } from 'discord.js'
import { logger } from '@/lib/logger'

// 環境変数
const { DISCORD_GUILD_ID, DISCORD_MEMBER_COUNT_CHANNEL_ID } = process.env

if (!(DISCORD_GUILD_ID && DISCORD_MEMBER_COUNT_CHANNEL_ID)) {
	throw new Error('環境変数が設定されていません')
}

// メンバー数を更新する関数
const memberCounts = async (client: Client) => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(DISCORD_GUILD_ID)

		// メンバー数を取得
		const members = await guild.members.fetch()
		const memberCount = members.filter((member) => !member.user.bot).size

		// チャンネルを取得
		const memberCountChannel = await guild.channels.fetch(DISCORD_MEMBER_COUNT_CHANNEL_ID)
		if (!memberCountChannel || memberCountChannel.type !== 2) {
			// チャンネルが見つからなかった場合のエラー処理
			logger.error('指定されたチャンネルが見つかりませんでした')
			return
		}

		// チャンネル名を更新
		const newChannelName = `👥 メンバー数:${memberCount}`
		await memberCountChannel.setName(newChannelName)
	} catch (error) {
		// エラー発生時に例外をスローしつつ、エラーログを出力
		logger.error('メンバー数更新中にエラーが発生しました:', (error as Error).message)
	}
}

// メンバー数を定期的に更新する関数
export const updateMemberCounts = async (client: Client) => {
	try {
		// ボット起動時にメンバー数を更新
		await memberCounts(client)

		// メンバー数の更新を監視
		checkForMemberCounts(client)

		logger.info('メンバー数更新の監視を開始します')
	} catch (error) {
		// 初期更新時のエラーをキャッチしてログに出力
		logger.error('初期メンバー数更新に失敗しました:', (error as Error).message)
	}
}

/**
 * メンバー数を定期的に更新する関数
 * @param client
 */
const checkForMemberCounts = (client: Client) => {
	const timer = 1000 * 60 * 10

	setTimeout(async () => {
		await memberCounts(client)

		checkForMemberCounts(client)
	}, timer)
}
