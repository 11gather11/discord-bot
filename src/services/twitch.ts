import {
	fetchStreamingStatus,
	fetchTwitchAccessToken,
	fetchTwitchGameInfo,
	isAccessTokenValid,
} from '@/api/twitchApi'
import { postTweet } from '@/services/twitter'
import type {} from '@/types/twitch'
import { type Client, EmbedBuilder, TextChannel } from 'discord.js'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { DISCORD_STREAMS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(DISCORD_STREAMS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
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
}: SendNotification): Promise<void> => {
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
const checkStream = async (
	client: Client,
	userLogin: string,
	accessToken: string,
	notified: boolean
): Promise<Result<boolean, Error>> => {
	// 配信状況を取得
	const streamingStatusResult = await fetchStreamingStatus(accessToken, userLogin)

	if (streamingStatusResult.isErr()) {
		return err(streamingStatusResult.error)
	}

	// 通知の判定と送信
	if (streamingStatusResult.value && !notified) {
		const twitchGameResult = await fetchTwitchGameInfo(
			accessToken,
			streamingStatusResult.value.game_id
		)
		if (twitchGameResult.isErr()) {
			return err(twitchGameResult.error)
		}

		// 配信情報を取得
		const {
			user_name: userName,
			title,
			viewer_count: viewerCount,
			started_at,
			thumbnail_url,
		} = streamingStatusResult.value
		const startedAt = new Date(started_at).toLocaleString('ja-JP')
		const gameName = twitchGameResult.value?.name || '不明'
		const gameImageUrl =
			twitchGameResult.value?.box_art_url ||
			'https://via.placeholder.com/144x192.png?text=No+Image'
				.replace('{width}', '144')
				.replace('{height}', '192')
		const thumbnailUrl = thumbnail_url.replace('{width}', '640').replace('{height}', '360')

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
		return ok(true)
	}
	if (!streamingStatusResult.value && notified) {
		// 配信中でなく通知済みの場合は通知済みフラグをfalseにセット
		return ok(false)
	}
	// 通知済みフラグをそのまま返す
	return ok(notified)
}

// Twitchの配信状況を監視開始
export const startTwitchLiveNotification = async (
	client: Client,
	userLogin: string
): Promise<void> => {
	try {
		// 初回のアクセストークンを取得
		const tokenResult = await fetchTwitchAccessToken()
		if (tokenResult.isErr()) {
			console.error(tokenResult.error)
			return
		}
		let accessToken = tokenResult.value

		// 通知済みフラグ
		let notified = false
		// ボット起動時に配信状況をチェック
		const checkStreamResult = await checkStream(client, userLogin, accessToken, notified)
		if (checkStreamResult.isErr()) {
			console.error(checkStreamResult.error)
			return
		}
		notified = checkStreamResult.value
		// 配信状況の監視を開始
		console.log(`配信状況の監視を開始しました: ${userLogin}`)
		// 60秒ごとにチェック
		const interval = setInterval(async () => {
			// トークンチェックと更新
			const AccessTokenValidResult = await isAccessTokenValid(accessToken)
			if (AccessTokenValidResult.isOk() && !AccessTokenValidResult.value) {
				const tokenCheckResult = await fetchTwitchAccessToken()
				if (tokenCheckResult.isErr()) {
					console.error(tokenCheckResult.error)
					return clearInterval(interval)
				}
				accessToken = tokenCheckResult.value
			}
			const checkStreamResult = await checkStream(client, userLogin, accessToken, notified)
			if (checkStreamResult.isErr()) {
				console.error(checkStreamResult.error)
				return clearInterval(interval)
			}
			notified = checkStreamResult.value
		}, 1000 * 60)
	} catch (error) {
		// 初期化エラー時のエラーログを出力
		console.error('Twitchライブ通知初期化エラー:', (error as Error).message)
	}
}
