import type { TwitchGame, TwitchStream, TwitchToken } from '@/types/twitch'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env
if (!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET)) {
	throw new Error('環境変数が設定されていません')
}

/**
 * Twitch APIを使用して、アクセストークンを取得します
 * @returns {Promise<Result<string, Error>>} アクセストークンの取得結果
 */
export const fetchTwitchAccessToken = async (): Promise<Result<string, Error>> => {
	try {
		const url = 'https://id.twitch.tv/oauth2/token'
		const response = await fetch(url, {
			method: 'POST',
			body: new URLSearchParams({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				client_id: TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				client_secret: TWITCH_CLIENT_SECRET,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				grant_type: 'client_credentials',
			}),
		})
		if (!response.ok) {
			return err(new Error('Twitchアクセストークンの取得に失敗しました'))
		}
		const data = (await response.json()) as TwitchToken
		return ok(data.access_token)
	} catch (error) {
		return err(error as Error)
	}
}

/**
 * Twitch APIを使用して、ゲーム情報を取得します
 * @param {string} accessToken アクセストークン
 * @param {string} gameId ゲームID
 * @returns {Promise<Result<TwitchGame | undefined, Error>>} ゲーム情報の取得結果
 */
export const fetchTwitchGameInfo = async (
	accessToken: string,
	gameId: string
): Promise<Result<TwitchGame | undefined, Error>> => {
	try {
		const url = 'https://api.twitch.tv/helix/games'
		const params = new URLSearchParams({ id: gameId })
		const response = await fetch(`${url}?${params}`, {
			headers: {
				'Client-ID': TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
		})
		if (!response.ok) {
			return err(new Error('Twitchゲーム情報の取得に失敗しました'))
		}
		const data = (await response.json()) as { data?: TwitchGame[] }
		return ok(data.data?.[0] ?? undefined)
	} catch (error) {
		return err(error as Error)
	}
}

/**
 * Twitch APIを使用して、配信情報を取得します
 * @param {string} accessToken アクセストークン
 * @param {string} userLogin ユーザーログイン名
 * @returns {Promise<Result<TwitchStream | undefined, Error>>} 配信情報の取得結果
 */
export const fetchStreamingStatus = async (
	accessToken: string,
	userLogin: string
): Promise<Result<TwitchStream | undefined, Error>> => {
	try {
		const url = 'https://api.twitch.tv/helix/streams'
		// biome-ignore lint/style/useNamingConvention: <explanation>
		const params = new URLSearchParams({ user_login: userLogin })
		const response = await fetch(`${url}?${params}`, {
			headers: {
				'Client-ID': TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
		})
		if (!response.ok) {
			return err(new Error('Twitch配信情報の取得に失敗しました'))
		}
		const data = (await response.json()) as { data?: TwitchStream[] }
		return ok(data.data?.[0] ?? undefined)
	} catch (error) {
		return err(error as Error)
	}
}

/**
 * Twitch APIを使用して、アクセストークンの有効性を確認します
 * @param {string} accessToken アクセストークン
 * @returns {Promise<Result<boolean, Error>>} アクセストークンの有効性確認結果
 */
export const isAccessTokenValid = async (accessToken: string): Promise<Result<boolean, Error>> => {
	try {
		const url = 'https://id.twitch.tv/oauth2/validate'
		const response = await fetch(url, {
			headers: {
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
		})
		return response.ok ? ok(true) : ok(false)
	} catch (error) {
		return err(error as Error)
	}
}
