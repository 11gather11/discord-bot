import type { TwitchGame, TwitchStream, TwitchToken } from '@/types/twitch'

// 環境変数
const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env
if (!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET)) {
	throw new Error('環境変数が設定されていません')
}

/**
 * Twitch APIを使用して、アクセストークンを取得します
 * @returns {Promise<string>} アクセストークン
 */
export const fetchTwitchAccessToken = async (): Promise<string> => {
	const url = 'https://id.twitch.tv/oauth2/token'
	const response = await fetch(url, {
		method: 'POST',
		body: new URLSearchParams({
			client_id: TWITCH_CLIENT_ID,
			client_secret: TWITCH_CLIENT_SECRET,
			grant_type: 'client_credentials',
		}),
	})
	if (!response.ok) {
		throw new Error('Twitchアクセストークンの取得に失敗しました')
	}
	const data = (await response.json()) as TwitchToken
	return data.access_token
}

/**
 * Twitch APIを使用して、ゲーム情報を取得します
 * @param {string} accessToken アクセストークン
 * @param {string} gameId ゲームID
 * @returns {Promise<TwitchGame | undefined>} ゲーム情報
 */
export const fetchTwitchGameInfo = async (accessToken: string, gameId: string): Promise<TwitchGame | undefined> => {
	const url = 'https://api.twitch.tv/helix/games'
	const params = new URLSearchParams({ id: gameId })
	const response = await fetch(`${url}?${params}`, {
		headers: {
			'Client-ID': TWITCH_CLIENT_ID,
			Authorization: `Bearer ${accessToken}`,
		},
	})
	if (!response.ok) {
		throw new Error('Twitchゲーム情報の取得に失敗しました')
	}
	const data = (await response.json()) as { data?: TwitchGame[] }
	return data.data?.[0] ?? undefined
}

/**
 * Twitch APIを使用して、配信情報を取得します
 * @param {string} accessToken アクセストークン
 * @param {string} userLogin ユーザーログイン名
 * @returns {Promise<TwitchStream | undefined>} 配信情報
 */
export const fetchStreamingStatus = async (
	accessToken: string,
	userLogin: string,
): Promise<TwitchStream | undefined> => {
	const url = 'https://api.twitch.tv/helix/streams'
	const params = new URLSearchParams({ user_login: userLogin })
	const response = await fetch(`${url}?${params}`, {
		headers: {
			'Client-ID': TWITCH_CLIENT_ID,
			Authorization: `Bearer ${accessToken}`,
		},
	})
	if (!response.ok) {
		throw new Error('Twitch配信情報の取得に失敗しました')
	}
	const data = (await response.json()) as { data?: TwitchStream[] }
	return data.data?.[0] ?? undefined
}

/**
 * Twitch APIを使用して、アクセストークンの有効性を確認します
 * @param {string} accessToken アクセストークン
 * @returns {Promise<boolean>} アクセストークンの有効性
 */
export const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
	const url = 'https://id.twitch.tv/oauth2/validate'
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
	return response.ok
}
