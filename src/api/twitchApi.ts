import type { TwitchGame, TwitchStream } from '@/types/twitch'
import axios, { type AxiosError } from 'axios'

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env

if (!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET)) {
	throw new Error('環境変数が設定されていません')
}

// アクセストークンの取得
export const fetchTwitchAccessToken = async (): Promise<string> => {
	try {
		const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
			params: {
				// biome-ignore lint/style/useNamingConvention: <explanation>
				client_id: TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				client_secret: TWITCH_CLIENT_SECRET,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				grant_type: 'client_credentials',
			},
		})
		return response.data.access_token as string
	} catch (error) {
		console.error('Twitchアクセストークンの取得に失敗しました:', (error as AxiosError).message)
		throw new Error('Twitchアクセストークンの取得に失敗しました')
	}
}

// Twitchのゲーム情報を取得
export const fetchTwitchGameInfo = async (
	accessToken: string,
	gameId: string
): Promise<TwitchGame> => {
	try {
		const response = await axios.get('https://api.twitch.tv/helix/games', {
			headers: {
				'Client-ID': TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
			params: {
				id: gameId,
			},
		})

		const twitchGame: TwitchGame = response.data.data[0]
		return twitchGame
	} catch (error) {
		// ゲーム情報取得失敗時のエラーログを出力
		console.error('Twitchゲーム情報の取得に失敗しました:', (error as AxiosError).message)
		throw new Error('Twitchゲーム情報の取得に失敗しました')
	}
}

// 配信中かどうかをチェック
export const fetchStreamingStatus = async (
	accessToken: string,
	userLogin: string
): Promise<TwitchStream | undefined> => {
	try {
		const response = await axios.get('https://api.twitch.tv/helix/streams', {
			headers: {
				'Client-ID': TWITCH_CLIENT_ID,
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
			params: {
				// biome-ignore lint/style/useNamingConvention: <explanation>
				user_login: userLogin,
			},
		})

		const twitchStream: TwitchStream = response.data.data[0]
		return response.data.data.length > 0 ? twitchStream : undefined
	} catch (error) {
		// 配信情報取得失敗時のエラーログを出力
		console.error('Twitch配信情報の取得に失敗しました:', (error as Error).message)
		throw new Error('Twitch配信情報の取得に失敗しました')
	}
}

export const checkAccessToken = async (accessToken: string): Promise<string> => {
	try {
		const response = await axios.get('https://id.twitch.tv/oauth2/validate', {
			headers: {
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${accessToken}`,
			},
		})
		if (response.status !== 200) {
			return await fetchTwitchAccessToken()
		}
		return accessToken
	} catch (error) {
		console.error('Twitchアクセストークンの取得に失敗しました:', (error as AxiosError).message)
		throw new Error('Twitchアクセストークンの取得に失敗しました')
	}
}
