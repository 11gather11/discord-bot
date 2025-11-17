import type { TwitchGame, TwitchStream, TwitchToken } from '@/types/twitch'

const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix'
const TWITCH_OAUTH_BASE_URL = 'https://id.twitch.tv/oauth2'

const getCredentials = (): { clientId: string; clientSecret: string } => {
	const clientId = import.meta.env.TWITCH_CLIENT_ID
	const clientSecret = import.meta.env.TWITCH_CLIENT_SECRET
	if (!(clientId && clientSecret)) {
		throw new Error('[Twitch] TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not set')
	}
	return { clientId, clientSecret }
}

const buildHeaders = (accessToken: string): Record<string, string> => {
	const { clientId } = getCredentials()
	return {
		'Client-ID': clientId,
		Authorization: `Bearer ${accessToken}`,
	}
}

const fetchApi = async <T>(url: string, options: RequestInit, errorMessage: string): Promise<T> => {
	try {
		const response = await fetch(url, options)
		if (!response.ok) {
			throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`)
		}
		return (await response.json()) as T
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`[Twitch] ${message}`)
	}
}

export const fetchAccessToken = async (): Promise<string> => {
	const { clientId, clientSecret } = getCredentials()
	const url = `${TWITCH_OAUTH_BASE_URL}/token`
	const data = await fetchApi<TwitchToken>(
		url,
		{
			method: 'POST',
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'client_credentials',
			}),
		},
		'Failed to fetch access token',
	)
	return data.access_token
}

export const fetchGameInfo = async (accessToken: string, gameId: string): Promise<TwitchGame | undefined> => {
	const url = `${TWITCH_API_BASE_URL}/games?${new URLSearchParams({ id: gameId })}`
	const data = await fetchApi<{ data?: TwitchGame[] }>(
		url,
		{ headers: buildHeaders(accessToken) },
		'Failed to fetch game info',
	)
	return data.data?.[0]
}

export const fetchStreamingStatus = async (
	accessToken: string,
	userLogin: string,
): Promise<TwitchStream | undefined> => {
	const url = `${TWITCH_API_BASE_URL}/streams?${new URLSearchParams({ user_login: userLogin })}`
	const data = await fetchApi<{ data?: TwitchStream[] }>(
		url,
		{ headers: buildHeaders(accessToken) },
		'Failed to fetch streaming status',
	)
	return data.data?.[0]
}

export const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
	const url = `${TWITCH_OAUTH_BASE_URL}/validate`
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
	return response.ok
}
