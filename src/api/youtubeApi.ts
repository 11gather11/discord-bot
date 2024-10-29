import type { Channel, PlaylistItems } from '@/types/youtube'
import axios from 'axios'

// 環境変数
const { YOUTUBE_API_KEY, DISCORD_VIDEOS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(YOUTUBE_API_KEY && DISCORD_VIDEOS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

// チャンネルのアップロードプレイリストIDを取得
export const fetchUploadsPlaylistId = async (channelId: string): Promise<string> => {
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
		throw new Error('チャンネルが見つかりませんでした')
	} catch (error) {
		console.error('YouTubeアップロードプレイリストID取得エラー:', (error as Error).message)
		throw new Error('YouTubeアップロードプレイリストID取得エラー')
	}
}

// YouTubeチャンネルの最新動画を取得
export const fetchLatestYouTubeVideo = async (uploadsPlaylistId: string) => {
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
