import type { Client } from 'discord.js'

// 環境変数
const { DISCORD_GUILD_ID, DISCORD_MEMBER_COUNT_CHANNEL_ID } = process.env
if (!(DISCORD_GUILD_ID && DISCORD_MEMBER_COUNT_CHANNEL_ID)) {
	console.error('環境変数が設定されていません')
	process.exit(1)
}

const MemberCounts = async (client: Client) => {
	try {
		// サーバーを取得
		const guild = client.guilds.cache.get(DISCORD_GUILD_ID)
		if (!guild) {
			console.error('指定されたサーバーが見つかりませんでした')
			return
		}

		// メンバー数を取得
		const memberCount = guild.memberCount

		// チャンネルを取得
		const memberCountChannel = guild.channels.cache.get(DISCORD_MEMBER_COUNT_CHANNEL_ID)
		if (!memberCountChannel || memberCountChannel.type !== 2) {
			console.error('指定されたチャンネルが見つかりませんでした')
			return
		}

		const newChannelName = `👥メンバー数:${memberCount}`
		await memberCountChannel.setName(newChannelName)
	} catch (error) {
		console.error('メンバー数の更新に失敗しました:', error)
	}
}

export const updateMemberCounts = async (client: Client) => {
	// ボット起動時にメンバー数を更新
	await MemberCounts(client)
	console.log('メンバー数を更新の観測を開始します')
	// 1時間ごとにメンバー数を更新
	setInterval(
		async () => {
			await MemberCounts(client)
		},
		1000 * 60 * 60
	)
}
