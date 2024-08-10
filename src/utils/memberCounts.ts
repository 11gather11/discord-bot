import type { Client } from 'discord.js'

import 'dotenv/config'

// 環境変数
const { DISCORD_GUILD_ID, DISCORD_MEMBER_COUNT_CHANNEL_ID } = process.env

const MemberCounts = async (client: Client) => {
	try {
		// サーバーを取得
		const guild = client.guilds.cache.get(DISCORD_GUILD_ID as string)
		if (!guild) {
			console.error('指定されたサーバーが見つかりませんでした')
			return
		}

		// メンバー数を取得
		const memberCount = guild.memberCount

		// チャンネルを取得
		const memberCountChannel = guild.channels.cache.get(DISCORD_MEMBER_COUNT_CHANNEL_ID as string)
		if (!memberCountChannel || memberCountChannel.type !== 2) {
			console.error('指定されたチャンネルが見つかりませんでした')
			return
		}

		const newChannelName = `👥メンバー数:${memberCount}`
		await memberCountChannel.setName(newChannelName)
		console.log('メンバー数を更新しました:', memberCount)
	} catch (error) {
		console.error('メンバー数の更新に失敗しました:', error)
	}
}

export const updateMemberCounts = async (client: Client) => {
	// ボット起動時にメンバー数を更新
	await MemberCounts(client)

	// 1時間ごとにメンバー数を更新
	setInterval(
		async () => {
			await MemberCounts(client)
		},
		1000 * 60 * 60
	)
}
