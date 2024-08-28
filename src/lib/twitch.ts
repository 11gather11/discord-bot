import axios from 'axios'
import { type Client, EmbedBuilder, TextChannel } from 'discord.js'
import TwitterApi from 'twitter-api-v2'
import type { TwitchGame, TwitchStream } from '../types/twitch'

// 環境変数
const {
	TWITCH_CLIENT_ID,
	TWITCH_CLIENT_SECRET,
	DISCORD_STREAMS_CHANNEL_ID,
	DISCORD_GUILD_ID,
	TWITTER_API_KEY,
	TWITTER_API_SECRET_KEY,
	TWITTER_ACCESS_TOKEN,
	TWITTER_ACCESS_TOKEN_SECRET,
} = process.env

if (
	!(
		TWITCH_CLIENT_ID &&
		TWITCH_CLIENT_SECRET &&
		DISCORD_STREAMS_CHANNEL_ID &&
		DISCORD_GUILD_ID &&
		TWITTER_API_KEY &&
		TWITTER_API_SECRET_KEY &&
		TWITTER_ACCESS_TOKEN &&
		TWITTER_ACCESS_TOKEN_SECRET
	)
) {
	throw new Error('環境変数が設定されていません')
}

let accessToken = ''
const streamingNotified = new Map<string, boolean>()

// Twitter APIクライアントを初期化
const twitterClient = new TwitterApi({
	appKey: TWITTER_API_KEY,
	appSecret: TWITTER_API_SECRET_KEY,
	accessToken: TWITTER_ACCESS_TOKEN,
	accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
})

interface PostTweet {
	userLogin: string
	userName: string
	title: string
	gameName: string
}

// Twitterにツイートを投稿
const postTweet = async ({ userLogin, userName, title, gameName }: PostTweet) => {
	try {
		const tweetText = `${userName}がTwitchで配信を開始しました! \n\n🎮 ゲーム: ${gameName}\n📺 タイトル: ${title}\n\n視聴はこちら: https://www.twitch.tv/${userLogin} \n\n#Twitch #配信`
		await twitterClient.v2.tweet(tweetText)
		console.log('ツイートを投稿しました')
	} catch (error) {
		console.error('ツイートの投稿に失敗しました:', (error as Error).message)
		return
	}
}

interface SendNotification {
	client: Client
	userLogin: string
	userName: string
	title: string
	viewerCount: number
	startedAt: string
	gameName: string
	thumbnailUrl: string
	gameImageUrl: string
}

// Twitchの配信通知を送信
const sendNotification = async ({
	client,
	userLogin,
	userName,
	title,
	viewerCount,
	startedAt,
	gameName,
	thumbnailUrl,
	gameImageUrl,
}: SendNotification) => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(DISCORD_GUILD_ID)
		// チャンネルを取得
		const channel = await guild.channels.fetch(DISCORD_STREAMS_CHANNEL_ID)
		if (channel instanceof TextChannel) {
			const embed = new EmbedBuilder()
				.setColor(0x9146ff) // 埋め込みの左側の色を設定
				.setTitle(`${title}`) // タイトルを設定
				.setURL(`https://www.twitch.tv/${userLogin}`) // タイトルをクリックするとTwitchにリンク
				.setAuthor({
					name: userName,
					url: `https://www.twitch.tv/${userLogin}`,
				}) // 名前を設定
				.setThumbnail(gameImageUrl) // 埋め込みの右上に表示される画像を設定
				.addFields(
					{ name: '👥 視聴者数', value: viewerCount.toString(), inline: true },
					{ name: '🎮 ゲーム', value: gameName, inline: true }
				) // 埋め込みのフィールドを追加
				.setImage(thumbnailUrl) // サムネイルを大きな画像として表示
				.setFooter({
					text: `配信開始: ${startedAt}`,
					// biome-ignore lint/style/useNamingConvention: <explanation>
					iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png',
				}) // 埋め込みの下部に表示されるフッターを設定
			// メッセージを送信
			await channel.send({
				content: `@everyone ${userName}がTwitchで配信を開始しました!`,
				embeds: [embed],
			})
			// 配信開始時にTwitterにツイートを投稿
			await postTweet({
				userLogin: userLogin,
				userName: userName,
				title: title,
				gameName: gameName,
			})
			console.log('Twitch配信通知を送信しました')
		} else {
			console.error('指定されたチャンネルIDはテキストチャンネルではありません')
			return
		}
	} catch (error) {
		// エラー発生時に例外をスローしつつ、エラーログを出力
		console.error('Twitch配信通知エラー:', (error as Error).message)
		return
	}
}

// アクセストークンを取得
const getTwitchAccessToken = async () => {
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
		// アクセストークンを保存
		accessToken = response.data.access_token
	} catch (error) {
		// アクセストークン取得失敗時のエラーログを出力
		console.error('Twitchアクセストークンの取得に失敗しました:', (error as Error).message)
		return
	}
}

// Twitchのゲーム情報を取得
const getTwitchGame = async (gameId: string): Promise<TwitchGame | undefined> => {
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
		console.error('Twitchゲーム情報の取得に失敗しました:', (error as Error).message)
		return
	}
}

// 配信中かどうかをチェック
const isStreaming = async (userLogin: string): Promise<TwitchStream | undefined> => {
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
		return
	}
}

// Twitchの配信状況をチェック
const checkStream = async (client: Client, userLogin: string) => {
	try {
		// 通知済みフラグが未セットの場合はセット
		if (!streamingNotified.has(userLogin)) {
			streamingNotified.set(userLogin, false)
		}

		// 配信状況を取得
		const stream = await isStreaming(userLogin)
		// 通知済みフラグを取得
		const notified = streamingNotified.get(userLogin)

		// 配信中かつ未通知の場合は通知
		if (stream && !notified) {
			const twitchGame = await getTwitchGame(stream.game_id)
			if (!twitchGame) {
				console.error('Twitchゲーム情報の取得に失敗しました')
				return
			}
			// 配信情報を取得
			const title = stream.title
			const userName = stream.user_name
			const viewerCount = stream.viewer_count
			const startedAt = new Date(stream.started_at).toLocaleString('ja-JP')
			const gameName = twitchGame.name
			const gameImageUrl = twitchGame.box_art_url
				.replace('{width}', '144')
				.replace('{height}', '192')
			const thumbnailUrl = stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360')

			// 通知を送信
			await sendNotification({
				client: client,
				userLogin: userLogin,
				userName: userName,
				title: title,
				viewerCount: viewerCount,
				startedAt: startedAt,
				gameName: gameName,
				thumbnailUrl: thumbnailUrl,
				gameImageUrl: gameImageUrl,
			})

			// 通知済みフラグをtrueにセット
			streamingNotified.set(userLogin, true)
		} else if (!stream && notified) {
			// 配信中でなく通知済みの場合は通知済みフラグをfalseにセット
			streamingNotified.set(userLogin, false)
		}
	} catch (error) {
		// 配信チェック中のエラーログを出力
		console.error('Twitch配信チェックエラー:', (error as Error).message)
	}
}

// Twitchの配信状況を監視開始
export const startTwitchLiveNotification = async (client: Client, userLogin: string) => {
	try {
		// アクセストークンを取得
		await getTwitchAccessToken()
		// ボット起動時に配信状況をチェック
		await checkStream(client, userLogin)
		// 配信状況の監視を開始
		console.log(`配信状況の監視を開始しました: ${userLogin}`)
		// 60秒ごとにチェック
		setInterval(async () => {
			try {
				await checkStream(client, userLogin)
			} catch (error) {
				// 定期チェック中のエラーログを出力
				console.error('Twitchライブ通知エラー:', (error as Error).message)
			}
		}, 1000 * 60)
	} catch (error) {
		// 初期化エラー時のエラーログを出力
		console.error('Twitchライブ通知初期化エラー:', (error as Error).message)
	}
}
