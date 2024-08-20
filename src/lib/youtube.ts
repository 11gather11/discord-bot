import axios from 'axios'
import type { Client } from 'discord.js'

// 環境変数
const { YOUTUBE_API_KEY, DISCORD_VIDEOS_CHANNEL_ID } = process.env
if (!(YOUTUBE_API_KEY && DISCORD_VIDEOS_CHANNEL_ID)) {
	console.error('環境変数が設定されていません')
	process.exit(1)
}

const lastVideoId = new Map<string, string>()

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, title: string, videoId: string) => {
	const channel = await client.channels.fetch(DISCORD_VIDEOS_CHANNEL_ID)
	if (!channel) {
		console.error('指定されたチャンネルが見つかりませんでした')
		return
	}
	if (channel.isTextBased()) {
		await channel.send({
			content: `@everyone 新しい動画が投稿されました！\nタイトル: ${title}\n視聴はこちら: https://www.youtube.com/watch?v=${videoId}`,
		})
	} else {
		console.error('指定されたチャンネルIDはテキストチャンネルではありません')
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
				key: YOUTUBE_API_KEY,
			},
		})

		const items = response.data.items
		return items.length > 0 ? items[0] : null
	} catch (error) {
		console.error('YouTube最新動画取得エラー:', error)
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
		console.error('初期化エラー:', error)
	}
}

// YouTubeの新しい動画投稿をチェック
const checkYouTubeVideo = async (client: Client, channelId: string) => {
	try {
		const latestVideo = await getLatestYouTubeVideo(channelId)

		if (latestVideo) {
			const videoId = latestVideo.id.videoId

			if (lastVideoId.get(channelId) !== videoId) {
				const title = latestVideo.snippet.title
				await sendYouTubeVideoNotification(client, title, videoId)
				lastVideoId.set(channelId, videoId)
			}
		}
	} catch (error) {
		console.error('YouTube動画通知エラー:', error)
	}
}

// YouTubeの動画投稿を監視開始
export const startYouTubeVideoNotification = async (client: Client, channelId: string) => {
	try {
		// 起動時に最新動画IDを初期化
		await initializeLastVideoId(channelId)
		console.log(`YouTube動画投稿の監視を開始しました: ${channelId}`)
		setInterval(() => checkYouTubeVideo(client, channelId), 1000 * 60 * 10) // 10分ごとにチェック
	} catch (error) {
		console.error('YouTube動画通知初期化エラー:', error)
	}
}
