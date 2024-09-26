import type { Channel, PlaylistItems } from '@/types/youtube'
import axios from 'axios'
import type { Client } from 'discord.js'

// 環境変数
const { YOUTUBE_API_KEY, DISCORD_VIDEOS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(YOUTUBE_API_KEY && DISCORD_VIDEOS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

const lastVideoId = new Map<string, string>()

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, videoId: string) => {
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

// チャンネルのアップロードプレイリストIDを取得
const getUploadsPlaylistId = async (channelId: string) => {
	try {
		const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
			params: {
				part: 'contentDetails',
				id: channelId,
				key: YOUTUBE_API_KEY,
			},
		})
		const data: Channel = response.data
		const items = data.items
		if (items.length > 0) {
			return items[0].contentDetails.relatedPlaylists.uploads
		}
		console.error('チャンネルが見つかりませんでした')
		return null
	} catch (error) {
		console.error('YouTubeアップロードプレイリストID取得エラー:', (error as Error).message)
		return null
	}
}

// YouTubeチャンネルの最新動画を取得
const getLatestYouTubeVideo = async (uploadsPlaylistId: string) => {
	try {
		const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
			params: {
				part: 'snippet,contentDetails',
				playlistId: uploadsPlaylistId,
				maxResults: 1,
				key: YOUTUBE_API_KEY,
			},
		})

		const data: PlaylistItems = response.data
		const items = data.items
		return items.length > 0 ? items[0] : null
	} catch (error) {
		console.error('YouTube最新動画取得エラー:', (error as Error).message)
	}
}

// 初期化関数：起動時に最新動画IDを保存
const initializeLastVideoId = async (uploadsPlaylistId: string) => {
	try {
		if (uploadsPlaylistId) {
			const latestVideo = await getLatestYouTubeVideo(uploadsPlaylistId)
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
const checkYouTubeVideo = async (client: Client, uploadsPlaylistId: string) => {
	try {
		const latestVideo = await getLatestYouTubeVideo(uploadsPlaylistId)

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
export const startYouTubeVideoNotification = async (client: Client, channelId: string) => {
	try {
		// 起動時に最新動画IDを初期化
		const uploadsPlaylistId = await getUploadsPlaylistId(channelId)
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
