import type { Channel, Playlist, PlaylistItems } from '@/types/youtube'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { YOUTUBE_API_KEY } = process.env
if (!YOUTUBE_API_KEY) {
	throw new Error('環境変数が設定されていません')
}

/**
 * YouTube APIを使用して、アップロードプレイリストIDを取得します
 * @param {string} channelId チャンネルID
 * @returns {Promise<Result<string, Error>>} アップロードプレイリストIDの取得結果
 */
export const fetchUploadsPlaylistId = async (channelId: string): Promise<Result<string, Error>> => {
	try {
		const url = 'https://www.googleapis.com/youtube/v3/channels'
		const params = new URLSearchParams({
			part: 'contentDetails',
			id: channelId,
			key: YOUTUBE_API_KEY,
		})
		const response = await fetch(`${url}?${params}`)
		if (!response.ok) {
			err(new Error('YouTubeアップロードプレイリストID取得エラー'))
		}
		const data = (await response.json()) as Channel
		if (!data.items) {
			return err(new Error('チャンネルが見つかりませんでした'))
		}
		return ok(data.items[0].contentDetails.relatedPlaylists.uploads)
	} catch (error) {
		return err(error as Error)
	}
}

/**
 * YouTube APIを使用して、最新の動画を取得します
 * @param {string} uploadsPlaylistId アップロードプレイリストID
 * @returns {Promise<Result<PlaylistItems, Error>>} 最新動画の取得結果
 */
export const fetchLatestYouTubeVideo = async (
	uploadsPlaylistId: string
): Promise<Result<PlaylistItems, Error>> => {
	const url = 'https://www.googleapis.com/youtube/v3/playlistItems'
	const params = new URLSearchParams({
		part: 'snippet,contentDetails',
		playlistId: uploadsPlaylistId,
		maxResults: '1',
		key: YOUTUBE_API_KEY,
	})
	const response = await fetch(`${url}?${params}`)
	if (!response.ok) {
		err(new Error('YouTube最新動画取得エラー'))
	}
	const data = (await response.json()) as Playlist
	if (!data.items || data.items.length === 0) {
		throw new Error('最新動画が見つかりませんでした')
	}
	return ok(data.items[0])
}
