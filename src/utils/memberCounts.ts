import type { Client } from 'discord.js'

// 環境変数
const { DISCORD_GUILD_ID, DISCORD_MEMBER_COUNT_CHANNEL_ID } = process.env

const MemberCounts = async (client: Client) => {
	try {
		// サーバーを取得
		const guild = client.guilds.cache.get(DISCORD_GUILD_ID as string)
		if (!guild) {
			throw new Error('指定されたサーバーが見つかりませんでした')
		}

		// メンバー数を取得
		const memberCount = guild.memberCount

		// チャンネルを取得
		const memberCountChannel = guild.channels.cache.get(DISCORD_MEMBER_COUNT_CHANNEL_ID as string)
		if (!memberCountChannel || memberCountChannel.type !== 2) {
			throw new Error('指定されたチャンネルが見つかりませんでした')
		}

		const newChannelName = `👥メンバー数:${memberCount}`
		await memberCountChannel.setName(newChannelName)
	} catch (error) {
		throw error as Error
	}
}

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
					console.error('定期メンバー数更新中にエラーが発生しました:', (error as Error).message)
				}
			},
			1000 * 60 * 60
		)
	} catch (error) {
		console.error('初期メンバー数更新に失敗しました:', (error as Error).message)
	}
}
