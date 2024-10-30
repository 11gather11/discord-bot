import { fetchLatestYouTubeVideo, fetchUploadsPlaylistId } from '@/api/youtubeApi'
import type { Client } from 'discord.js'

// 環境変数
const { DISCORD_VIDEOS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(DISCORD_VIDEOS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

const lastVideoId = new Map<string, string>()

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, videoId: string): Promise<void> => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(DISCORD_GUILD_ID)
		// チャンネルを取得
		const channel = await guild.channels.fetch(DISCORD_VIDEOS_CHANNEL_ID)
		// チャンネルが見つからない場合はエラーを出力
		if (!channel) {
			return console.error('指定されたチャンネルが見つかりませんでした')
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

// 初期化関数：起動時に最新動画IDを保存
const initializeLastVideoId = async (uploadsPlaylistId: string): Promise<void> => {
	try {
		if (uploadsPlaylistId) {
			const latestVideo = await fetchLatestYouTubeVideo(uploadsPlaylistId)
			if (latestVideo) {
				const videoId = latestVideo.contentDetails.videoId
				lastVideoId.set(uploadsPlaylistId, videoId)
			}
		}
	} catch (error) {
		console.error('YouTube動画初期化エラー:', (error as Error).message)
	}
}

// YouTubeの新しい動画投稿をチェック
const checkYouTubeVideo = async (client: Client, uploadsPlaylistId: string): Promise<void> => {
	try {
		const latestVideo = await fetchLatestYouTubeVideo(uploadsPlaylistId)

		if (latestVideo) {
			const videoId = latestVideo.contentDetails.videoId

			if (lastVideoId.get(uploadsPlaylistId) !== videoId) {
				await sendYouTubeVideoNotification(client, videoId)
				lastVideoId.set(uploadsPlaylistId, videoId)
			}
		}
	} catch (error) {
		console.error('YouTube動画チェックエラー:', (error as Error).message)
	}
}

// YouTubeの動画投稿を監視開始
export const startYouTubeVideoNotification = async (
	client: Client,
	channelId: string
): Promise<void> => {
	try {
		// 起動時に最新動画IDを初期化
		const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)
		if (!uploadsPlaylistId) {
			return console.error('プレイリストIDが見つかりませんでした')
		}
		await initializeLastVideoId(uploadsPlaylistId)
		console.log(`YouTube動画投稿の監視を開始しました: ${channelId}`)
		setInterval(
			async () => {
				try {
					await checkYouTubeVideo(client, uploadsPlaylistId)
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
