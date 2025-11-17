import { type Client, EmbedBuilder, TextChannel } from 'discord.js'
import { fetchStreamingStatus, fetchTwitchAccessToken, fetchTwitchGameInfo, isAccessTokenValid } from '@/api/twitchApi'
import { logger } from '@/lib/logger'
import { postTweet } from '@/services/twitter'
import type { TwitchGame, TwitchStream } from '@/types/twitch'

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
export const startTwitchLiveNotification = async (client: Client, userLogin: string): Promise<void> => {
	try {
		// 初回のアクセストークンを取得
		const accessToken = await fetchTwitchAccessToken()
		const notified = false

		// 配信状況の監視を開始
		logger.info(`配信状況の監視を開始しました: ${userLogin}`)

		// チェックを開始
		await checkStreamingStatus(client, userLogin, accessToken, notified)
	} catch (error) {
		logger.error(error as Error)
	}
}

/**
 * 配信状況をチェックして通知を送信
 * @param {Client} client Discordクライアント
 * @param {string} userLogin ユーザーログイン名
 * @param {string} accessToken アクセストークン
 * @param {boolean} notified 通知済みフラグ
 * @returns {Promise<void>}
 */
const checkStreamingStatus = async (
	client: Client,
	userLogin: string,
	accessToken: string,
	notified: boolean,
): Promise<void> => {
	try {
		// トークンチェックと更新
		const isValid = await isAccessTokenValid(accessToken)
		const currentAccessToken = !isValid ? await fetchTwitchAccessToken() : accessToken

		const newNotified = await handleTwitchStreamingNotification(client, userLogin, currentAccessToken, notified)

		// 一定時間後に再度チェック
		const timer = 1000 * 60
		setTimeout(() => {
			checkStreamingStatus(client, userLogin, currentAccessToken, newNotified)
		}, timer)
	} catch (error) {
		logger.error(error as Error)
	}
}

/**
 * 配信状況をチェックして通知を送信その後通知済みフラグを更新
 * @param {Client} client Discordクライアント
 * @param {string} userLogin ユーザーログイン名
 * @param {string} accessToken アクセストークン
 * @param {boolean} notified 通知済みフラグ
 * @returns {Promise<boolean>} 通知済みフラグの更新結果
 */
const handleTwitchStreamingNotification = async (
	client: Client,
	userLogin: string,
	accessToken: string,
	notified: boolean,
): Promise<boolean> => {
	// 配信状況を取得
	const streamingStatus = await fetchStreamingStatus(accessToken, userLogin)

	// 通知するかの判定
	if (streamingStatus && !notified) {
		const twitchGameInfo = await fetchTwitchGameInfo(accessToken, streamingStatus.game_id)

		// 通知を送信
		await sendTwitchStreamingNotification(client, userLogin, streamingStatus, twitchGameInfo)

		// 通知済みフラグをtrueにセット
		return true
	}
	if (!streamingStatus && notified) {
		// 配信中でなく通知済みの場合は通知済みフラグをfalseにセット
		return false
	}
	// 通知する必要がない場合は通知済みフラグをそのまま返す
	return notified
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
	twitchGameInfo: TwitchGame | undefined,
): Promise<void> => {
	const { user_name: userName, title, viewer_count: viewerCount, started_at, thumbnail_url } = streamingStatus
	const startedAt = new Date(started_at).toLocaleString('ja-JP')
	const gameName = twitchGameInfo?.name || '不明'
	const gameImageUrl =
		twitchGameInfo?.box_art_url ||
		'https://via.placeholder.com/144x192.png?text=No+Image'.replace('{width}', '144').replace('{height}', '192')
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
			{ name: '🎮 ゲーム', value: gameName, inline: true },
		) // 埋め込みのフィールドを追加
		.setImage(thumbnailUrl) // サムネイルを大きな画像として表示
		.setFooter({
			text: `配信開始: ${startedAt}`,
			iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png',
		}) // 埋め込みの下部に表示されるフッターを設定

	// 配信開始時にDiscordに通知を送信
	const embedMessage = `@everyone ${userName}がTwitchで配信を開始しました!`
	// 配信開始時にTwitterにツイートを投稿
	const tweetText = `${userName}がTwitchで配信を開始しました! \n\n🎮 ゲーム: ${gameName}\n📺 タイトル: ${title}\n\n視聴はこちら: https://www.twitch.tv/${userLogin} \n\n#Twitch #配信 #${gameName}`
	// メッセージを送信
	await Promise.all([
		sendDiscordEmbedMessage(client, DISCORD_GUILD_ID, DISCORD_STREAMS_CHANNEL_ID, embed, embedMessage),
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
	embed: EmbedBuilder,
	message: string,
): Promise<void> => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(guildId)
		// チャンネルを取得
		const channel = await guild.channels.fetch(channelId)
		if (channel instanceof TextChannel) {
			// メッセージを送信
			await channel.send({
				content: message,
				embeds: [embed],
			})
		} else {
			logger.error('指定されたチャンネルIDはテキストチャンネルではありません')
		}
	} catch (error) {
		logger.error('Discord埋め込みメッセージの送信に失敗しました:', (error as Error).message)
	}
}
