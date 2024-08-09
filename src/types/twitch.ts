export interface TwitchToken {
	// biome-ignore lint/style/useNamingConvention: <explanation>
	access_token: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	expires_in: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	token_type: string
}

export interface TwitchStream {
	id: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	user_id: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	user_login: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	user_name: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	game_id: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	game_name: string
	type: string
	title: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	viewer_count: number
	// biome-ignore lint/style/useNamingConvention: <explanation>
	started_at: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	thumbnail_url: string
}

export interface TwitchGame {
	id: string
	name: string
	// biome-ignore lint/style/useNamingConvention: <explanation>
	box_art_url: string
}
