import {
	checkAccessToken,
	fetchStreamingStatus,
	fetchTwitchAccessToken,
	fetchTwitchGameInfo,
} from '@/api/twitchApi'
import { postTweet } from '@/lib/twitter'
import type {} from '@/types/twitch'
import { type Client, EmbedBuilder, TextChannel } from 'discord.js'

// 環境変数
const { DISCORD_STREAMS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(DISCORD_STREAMS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

let accessToken = ''
const streamingNotified = new Map<string, boolean>()

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
			const tweetText = `${userName}がTwitchで配信を開始しました! \n\n🎮 ゲーム: ${gameName}\n📺 タイトル: ${title}\n\n視聴はこちら: https://www.twitch.tv/${userLogin} \n\n#Twitch #配信`
			await postTweet(tweetText)
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

// Twitchの配信状況をチェック
const checkStream = async (client: Client, userLogin: string) => {
	try {
		// 通知済みフラグが未セットの場合はセット
		if (!streamingNotified.has(userLogin)) {
			streamingNotified.set(userLogin, false)
		}
		// アクセストークンをチェック
		accessToken = await checkAccessToken(accessToken)
		// 配信状況を取得
		const stream = await fetchStreamingStatus(accessToken, userLogin)
		// 通知済みフラグを取得
		const notified = streamingNotified.get(userLogin)

		// 配信中かつ未通知の場合は通知
		if (stream && !notified) {
			const twitchGame = await fetchTwitchGameInfo(accessToken, stream.game_id)
			// 配信情報を取得
			const { user_name: userName, title, viewer_count: viewerCount } = stream
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
		accessToken = await fetchTwitchAccessToken()
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
