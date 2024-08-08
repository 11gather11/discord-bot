import axios from 'axios'
import { type Client, EmbedBuilder, TextChannel } from 'discord.js'

import 'dotenv/config'

//環境変数
const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, DISCORD_TWITCH_CHANNEL_ID } = process.env

let accessToken = ''
const userIds = new Map<string, string>()
const streamingNotified = new Map<string, boolean>()

const sendNotification = async (
	client: Client,
	user: string,
	title: string,
	viewerCount: number,
	gameName: string,
	thumbnailUrl: string
) => {
	const channel = await client.channels.fetch(DISCORD_TWITCH_CHANNEL_ID as string)
	if (channel instanceof TextChannel) {
		const embed = new EmbedBuilder()
			.setColor(0x9146ff) // 埋め込みの左側の色を設定
			.setAuthor({
				name: user,
				url: `https://www.twitch.tv/${user}`,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				iconURL: `https://static-cdn.jtvnw.net/jtv_user_pictures/${user}-profile_image-70x70.png`,
			}) // ユーザーのプロフィール画像をアイコンとして設定
			.setTitle(`${title}`)
			.setURL(`https://www.twitch.tv/${user}`)
			.addFields(
				{ name: '視聴者数', value: viewerCount.toString(), inline: true },
				{ name: 'ゲーム', value: gameName, inline: true }
			)
			.setImage(thumbnailUrl) // サムネイルを大きな画像として表示
			.setFooter({
				text: 'Twitch配信通知',
				// biome-ignore lint/style/useNamingConvention: <explanation>
				iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png',
			})
		await channel.send({ content: '@everyone', embeds: [embed] })
	} else {
		console.error('指定されたチャンネルIDはテキストチャンネルではありません')
	}
}

const getAccessToken = async () => {
	const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
		params: {
			// biome-ignore lint/style/useNamingConvention: <explanation>
			client_id: TWITCH_CLIENT_ID,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			client_secret: TWITCH_CLIENT_SECRET,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			grant_type: 'client_credentials',
		},
	})
	accessToken = response.data.access_token
}

const getUserId = async (user: string) => {
	const response = await axios.get('https://api.twitch.tv/helix/users', {
		headers: {
			'Client-ID': TWITCH_CLIENT_ID,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			Authorization: `Bearer ${accessToken}`,
		},
		params: {
			login: user,
		},
	})
	return response.data.data[0].id
}

const getGameName = async (gameId: string) => {
	const response = await axios.get('https://api.twitch.tv/helix/games', {
		headers: {
			'Client-ID': TWITCH_CLIENT_ID,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			Authorization: `Bearer ${accessToken}`,
		},
		params: {
			id: gameId,
		},
	})
	return response.data.data[0].name
}

const isStreaming = async (userId: string) => {
	const response = await axios.get('https://api.twitch.tv/helix/streams', {
		headers: {
			'Client-ID': TWITCH_CLIENT_ID,
			// biome-ignore lint/style/useNamingConvention: <explanation>
			Authorization: `Bearer ${accessToken}`,
		},
		params: {
			// biome-ignore lint/style/useNamingConvention: <explanation>
			user_id: userId,
		},
	})
	return response.data.data.length > 0 ? response.data.data[0] : null
}

const checkStream = async (client: Client, user: string) => {
	try {
		if (!userIds.has(user)) {
			const id = await getUserId(user)
			userIds.set(user, id)
			streamingNotified.set(user, false)
		}
		const userId = userIds.get(user) as string
		const stream = await isStreaming(userId)
		const notified = streamingNotified.get(user) as boolean
		if (stream && !notified) {
			const title = stream.title
			const viewerCount = stream.viewer_count
			const gameId = stream.game_id
			const gameName = await getGameName(gameId)
			const thumbnailUrl = stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360')
			await sendNotification(client, user, title, viewerCount, gameName, thumbnailUrl)
			streamingNotified.set(user, true)
		} else if (!stream && notified) {
			streamingNotified.set(user, false)
		}
	} catch (error) {
		console.error('Twitchライブ通知エラー:', error)
	}
}

// Twitchの配信状況を監視開始
export const startTwitchLiveNotification = async (client: Client, user: string) => {
	try {
		await getAccessToken()
		console.log(`配信状況の監視を開始しました: ${user}`)
		setInterval(() => checkStream(client, user), 60000) // 60秒ごとにチェック
	} catch (error) {
		console.error('Twitchライブ通知初期化エラー:', error)
	}
}
