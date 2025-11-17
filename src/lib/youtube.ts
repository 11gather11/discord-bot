import type { Channel, Playlist, PlaylistItems } from '@/types/youtube'

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

const getApiKey = (): string => {
	const apiKey = import.meta.env.YOUTUBE_API_KEY
	if (!apiKey) {
		throw new Error('[YouTube] YOUTUBE_API_KEY is not set')
	}
	return apiKey
}

const buildUrl = (endpoint: string, params: Record<string, string>): string => {
	const searchParams = new URLSearchParams({
		...params,
		key: getApiKey(),
	})
	return `${YOUTUBE_API_BASE_URL}/${endpoint}?${searchParams}`
}

const fetchApi = async <T>(url: string, errorMessage: string): Promise<T> => {
	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`)
		}
		return (await response.json()) as T
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`[YouTube] ${message}`)
	}
}

export const fetchUploadsPlaylistId = async (channelId: string): Promise<string> => {
	const url = buildUrl('channels', {
		part: 'contentDetails',
		id: channelId,
	})

	const data = await fetchApi<Channel>(url, 'Failed to fetch uploads playlist ID')

	const firstChannel = data.items?.[0]
	if (!firstChannel) {
		throw new Error(`[YouTube] Channel not found: ${channelId}`)
	}

	return firstChannel.contentDetails.relatedPlaylists.uploads
}

export const fetchLatestVideo = async (uploadsPlaylistId: string): Promise<PlaylistItems> => {
	const url = buildUrl('playlistItems', {
		part: 'snippet,contentDetails',
		playlistId: uploadsPlaylistId,
		maxResults: '1',
	})

	const data = await fetchApi<Playlist>(url, 'Failed to fetch latest video')

	const firstItem = data.items?.[0]
	if (!firstItem) {
		throw new Error(`[YouTube] No videos found in playlist: ${uploadsPlaylistId}`)
	}

	return firstItem
}
