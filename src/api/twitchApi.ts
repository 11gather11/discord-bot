import type { TwitchGame, TwitchStream, TwitchToken } from '@/types/twitch'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env
if (!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET)) {
	throw new Error('環境変数が設定されていません')
}

// アクセストークンの取得
export const fetchTwitchAccessToken = async (): Promise<Result<string, Error>> => {
	const response = await fetch('https://id.twitch.tv/oauth2/token', {
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
}

// Twitchのゲーム情報を取得
export const fetchTwitchGameInfo = async (
	accessToken: string,
	gameId: string
): Promise<Result<TwitchGame | undefined, Error>> => {
	const response = await fetch(`https://api.twitch.tv/helix/games?id=${gameId}`, {
		method: 'GET',
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
}

// 配信中かどうかをチェック
export const fetchStreamingStatus = async (
	accessToken: string,
	userLogin: string
): Promise<Result<TwitchStream | undefined, Error>> => {
	const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${userLogin}`, {
		method: 'GET',
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
}

// アクセストークンの有効性を確認
export const isAccessTokenValid = async (accessToken: string): Promise<Result<boolean, never>> => {
	const response = await fetch('https://id.twitch.tv/oauth2/validate', {
		method: 'GET',
		headers: {
			// biome-ignore lint/style/useNamingConvention: <explanation>
			Authorization: `Bearer ${accessToken}`,
		},
	})
	return response.ok ? ok(true) : ok(false)
}
