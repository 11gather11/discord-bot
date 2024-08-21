import type { Client } from 'discord.js'

// 環境変数
const { DISCORD_GUILD_ID, DISCORD_MEMBER_COUNT_CHANNEL_ID } = process.env

// メンバー数を更新する関数
const MemberCounts = async (client: Client) => {
	try {
		// サーバーを取得
		const guild = client.guilds.cache.get(DISCORD_GUILD_ID as string)
		if (!guild) {
			// サーバーが見つからなかった場合のエラー処理
			throw new Error('指定されたサーバーが見つかりませんでした')
		}

		// メンバー数を取得
		const memberCount = guild.memberCount

		// チャンネルを取得
		const memberCountChannel = guild.channels.cache.get(DISCORD_MEMBER_COUNT_CHANNEL_ID as string)
		if (!memberCountChannel || memberCountChannel.type !== 2) {
			// チャンネルが見つからなかった場合のエラー処理
			throw new Error('指定されたチャンネルが見つかりませんでした')
		}

		// チャンネル名を更新
		const newChannelName = `👥メンバー数:${memberCount}`
		await memberCountChannel.setName(newChannelName)
	} catch (error) {
		// エラー発生時に例外をスローしつつ、エラーログを出力
		console.error('メンバー数更新中にエラーが発生しました:', (error as Error).message)
		throw error as Error
	}
}

// メンバー数を定期的に更新する関数
export const updateMemberCounts = async (client: Client) => {
	try {
		// ボット起動時にメンバー数を更新
		await MemberCounts(client)
		console.log('メンバー数更新の観測を開始します')

		// 1時間ごとにメンバー数を更新
		setInterval(
			async () => {
				try {
					await MemberCounts(client)
				} catch (error) {
					// 定期更新中のエラーをキャッチしてログに出力
					console.error('定期メンバー数更新中にエラーが発生しました:', (error as Error).message)
				}
			},
			1000 * 60 * 60 // 1時間ごとの更新
		)
	} catch (error) {
		// 初期更新時のエラーをキャッチしてログに出力
		console.error('初期メンバー数更新に失敗しました:', (error as Error).message)
	}
}
