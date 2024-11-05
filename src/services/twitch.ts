import {
	fetchStreamingStatus,
	fetchTwitchAccessToken,
	fetchTwitchGameInfo,
	isAccessTokenValid,
} from '@/api/twitchApi'
import { postTweet } from '@/services/twitter'
import type { TwitchGame, TwitchStream } from '@/types/twitch'
import { type Client, EmbedBuilder, TextChannel } from 'discord.js'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { DISCORD_STREAMS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(DISCORD_STREAMS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

/**
 * Twitchの配信通知を開始
 * @param {Client} client Discordクライアント
 * @param {string} userLogin ユーザーログイン名
 * @returns {Promise<void>}
 */
export const startTwitchLiveNotification = async (
	client: Client,
	userLogin: string
): Promise<void> => {
	// 初回のアクセストークンを取得
	const tokenResult = await fetchTwitchAccessToken()
	if (tokenResult.isErr()) {
		console.error(tokenResult.error)
		return
	}
	let accessToken = tokenResult.value
	let notified = false
	// ボット起動時に配信状況をチェック
	const twitchStreamingNotificationResult = await handleTwitchStreamingNotification(
		client,
		userLogin,
		accessToken,
		notified
	)
	if (twitchStreamingNotificationResult.isErr()) {
		console.error(twitchStreamingNotificationResult.error)
		return
	}
	notified = twitchStreamingNotificationResult.value

	// 60秒ごとにチェック
	const timer = 1000 * 60
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
		const twitchStreamingNotificationResult = await handleTwitchStreamingNotification(
			client,
			userLogin,
			accessToken,
			notified
		)
		if (twitchStreamingNotificationResult.isErr()) {
			console.error(twitchStreamingNotificationResult.error)
			return clearInterval(interval)
		}
		notified = twitchStreamingNotificationResult.value
	}, timer)

	// 配信状況の監視を開始
	console.info(`配信状況の監視を開始しました: ${userLogin}`)
}

/**
 * 配信状況をチェックして通知を送信その後通知済みフラグを更新
 * @param {Client} client Discordクライアント
 * @param {string} userLogin ユーザーログイン名
 * @param {string} accessToken アクセストークン
 * @param {boolean} notified 通知済みフラグ
 * @returns {Promise<Result<boolean, Error>>} 通知済みフラグの更新結果
 */
const handleTwitchStreamingNotification = async (
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
	const streamingStatus = streamingStatusResult.value

	// 通知するかの判定
	if (streamingStatus && !notified) {
		const twitchGameInfoResult = await fetchTwitchGameInfo(accessToken, streamingStatus.game_id)
		if (twitchGameInfoResult.isErr()) {
			return err(twitchGameInfoResult.error)
		}
		const twitchGameInfo = twitchGameInfoResult.value

		// 通知を送信
		await sendTwitchStreamingNotification(client, userLogin, streamingStatus, twitchGameInfo)

		// 通知済みフラグをtrueにセット
		return ok(true)
	}
	if (!streamingStatusResult.value && notified) {
		// 配信中でなく通知済みの場合は通知済みフラグをfalseにセット
		return ok(false)
	}
	// 通知する必要がない場合は通知済みフラグをそのまま返す
	return ok(notified)
}

/**
 * Twitchの配信通知を送信
 * @param {Client} client Discordクライアント
 * @param {string} userLogin ユーザーログイン名
 * @param {TwitchStream} streamingStatus 配信状況
 * @param {TwitchGame | undefined} twitchGameInfo ゲーム情報
 * @returns {Promise<void>}
 */
const sendTwitchStreamingNotification = async (
	client: Client,
	userLogin: string,
	streamingStatus: TwitchStream,
	twitchGameInfo: TwitchGame | undefined
): Promise<void> => {
	const {
		user_name: userName,
		title,
		viewer_count: viewerCount,
		started_at,
		thumbnail_url,
	} = streamingStatus
	const startedAt = new Date(started_at).toLocaleString('ja-JP')
	const gameName = twitchGameInfo?.name || '不明'
	const gameImageUrl =
		twitchGameInfo?.box_art_url ||
		'https://via.placeholder.com/144x192.png?text=No+Image'
			.replace('{width}', '144')
			.replace('{height}', '192')
	const thumbnailUrl = thumbnail_url.replace('{width}', '640').replace('{height}', '360')

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

	// 配信開始時にTwitterにツイートを投稿
	const tweetText = `${userName}がTwitchで配信を開始しました! \n\n🎮 ゲーム: ${gameName}\n📺 タイトル: ${title}\n\n視聴はこちら: https://www.twitch.tv/${userLogin} \n\n#Twitch #配信`
	// メッセージを送信
	await Promise.all([
		sendDiscordEmbedMessage(client, DISCORD_GUILD_ID, DISCORD_STREAMS_CHANNEL_ID, embed),
		postTweet(tweetText),
	])
}

/**
 * Discordに埋め込みメッセージを送信
 * @param {Client} client Discordクライアント
 * @param {string} guildId サーバーID
 * @param {string} channelId チャンネルID
 * @param {EmbedBuilder} embed 埋め込みメッセージ
 * @returns {Promise<void>}
 */
const sendDiscordEmbedMessage = async (
	client: Client,
	guildId: string,
	channelId: string,
	embed: EmbedBuilder
): Promise<void> => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(guildId)
		// チャンネルを取得
		const channel = await guild.channels.fetch(channelId)
		if (channel instanceof TextChannel) {
			// メッセージを送信
			await channel.send({
				embeds: [embed],
			})
		} else {
			console.error('指定されたチャンネルIDはテキストチャンネルではありません')
		}
	} catch (error) {
		console.error('Discord埋め込みメッセージの送信に失敗しました:', (error as Error).message)
	}
}
