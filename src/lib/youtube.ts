import axios from 'axios'
import type { Client } from 'discord.js'

// 環境変数
const { YOUTUBE_API_KEY, DISCORD_VIDEOS_CHANNEL_ID } = process.env

const lastVideoId = new Map<string, string>()

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, videoId: string) => {
	try {
		const channel = await client.channels.fetch(DISCORD_VIDEOS_CHANNEL_ID as string)
		if (!channel) {
			console.error('指定されたチャンネルが見つかりませんでした')
			return
		}
		if (channel.isTextBased()) {
			await channel.send({
				content: `@everyone 新しい動画が投稿されました！\nhttps://www.youtube.com/watch?v=${videoId}`,
			})
			console.log('YouTube動画通知を送信しました')
		} else {
			console.error('指定されたチャンネルIDはテキストチャンネルではありません')
		}
	} catch (error) {
		console.error('YouTube動画通知送信エラー:', (error as Error).message)
	}
}

// YouTubeチャンネルの最新動画を取得
const getLatestYouTubeVideo = async (channelId: string) => {
	try {
		const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
			params: {
				part: 'snippet',
				channelId: channelId,
				order: 'date',
				maxResults: 1,
				type: 'video',
				eventType: 'completed',
				key: YOUTUBE_API_KEY,
			},
		})

		const items = response.data.items
		return items.length > 0 ? items[0] : null
	} catch (error) {
		console.error('YouTube最新動画取得エラー:', (error as Error).message)
		throw new Error('YouTube最新動画取得エラー')
	}
}

// 初期化関数：起動時に最新動画IDを保存
const initializeLastVideoId = async (channelId: string) => {
	try {
		const latestVideo = await getLatestYouTubeVideo(channelId)
		if (latestVideo) {
			const videoId = latestVideo.id.videoId
			lastVideoId.set(channelId, videoId)
		}
	} catch (error) {
		console.error('YouTube動画初期化エラー:', (error as Error).message)
		throw new Error('YouTube動画初期化エラー')
	}
}

// YouTubeの新しい動画投稿をチェック
const checkYouTubeVideo = async (client: Client, channelId: string) => {
	try {
		const latestVideo = await getLatestYouTubeVideo(channelId)

		if (latestVideo) {
			const videoId = latestVideo.id.videoId

			if (lastVideoId.get(channelId) !== videoId) {
				await sendYouTubeVideoNotification(client, videoId)
				lastVideoId.set(channelId, videoId)
			}
		}
	} catch (error) {
		console.error('YouTube動画チェックエラー:', (error as Error).message)
	}
}

// YouTubeの動画投稿を監視開始
export const startYouTubeVideoNotification = async (client: Client, channelId: string) => {
	try {
		// 起動時に最新動画IDを初期化
		await initializeLastVideoId(channelId)
		console.log(`YouTube動画投稿の監視を開始しました: ${channelId}`)
		setInterval(
			async () => {
				try {
					await checkYouTubeVideo(client, channelId)
				} catch (error) {
					console.error('YouTube動画通知エラー:', (error as Error).message)
				}
			},
			1000 * 60 * 20
		) // 20分ごとにチェック
	} catch (error) {
		console.error('YouTube動画通知初期化エラー:', (error as Error).message)
	}
}
