import { fetchLatestYouTubeVideo, fetchUploadsPlaylistId } from '@/api/youtubeApi'
import type { Client } from 'discord.js'
import { type Result, err, ok } from 'neverthrow'

// 環境変数
const { DISCORD_VIDEOS_CHANNEL_ID, DISCORD_GUILD_ID } = process.env

if (!(DISCORD_VIDEOS_CHANNEL_ID && DISCORD_GUILD_ID)) {
	throw new Error('環境変数が設定されていません')
}

/**
 * YouTubeの新しい動画の通知を開始
 * @param {Client} client Discordクライアント
 * @param {string} channelId チャンネルID
 * @returns {Promise<void>}
 */
export const startYouTubeVideoNotification = async (
	client: Client,
	channelId: string
): Promise<void> => {
	// 起動時にプレイリストIDを取得
	const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)
	if (uploadsPlaylistId.isErr()) {
		console.error(uploadsPlaylistId.error)
		return
	}

	// 最新動画IDを取得
	const lastVideoIdResult = await initLastVideoId(uploadsPlaylistId.value)
	if (lastVideoIdResult.isErr()) {
		console.error(lastVideoIdResult.error)
		return
	}
	let lastVideoId = lastVideoIdResult.value

	// 20分ごとにチェック
	const timer = 1000 * 60 * 20
	const interval = setInterval(async () => {
		const youTubeVideoNotificationResult = await handleYouTubeVideoNotification(
			client,
			uploadsPlaylistId.value,
			lastVideoId
		)
		if (youTubeVideoNotificationResult.isErr()) {
			console.error(youTubeVideoNotificationResult.error)
			return clearInterval(interval)
		}
		lastVideoId = youTubeVideoNotificationResult.value
	}, timer)

	// 動画投稿の監視を開始
	console.log(`YouTube動画投稿の監視を開始しました: ${channelId}`)
}

/**
 * YouTubeの新しい動画をチェックして通知を送信その後最新動画IDを返す
 * @param {Client} client Discordクライアント
 * @param {string} uploadsPlaylistId アップロードプレイリストID
 * @param {string} lastVideoId 最新動画ID
 * @returns {Promise<Result<string, Error>>} 最新動画IDの取得結果
 */
const handleYouTubeVideoNotification = async (
	client: Client,
	uploadsPlaylistId: string,
	lastVideoId: string
): Promise<Result<string, Error>> => {
	const latestVideo = await fetchLatestYouTubeVideo(uploadsPlaylistId)

	if (latestVideo.isErr()) {
		return err(latestVideo.error)
	}
	const videoId = latestVideo.value.contentDetails.videoId

	if (lastVideoId !== videoId) {
		await sendYouTubeVideoNotification(client, videoId)

		return ok(videoId)
	}
	return ok(lastVideoId)
}

// 初期化関数：起動時に最新動画IDを保存
const initLastVideoId = async (uploadsPlaylistId: string): Promise<Result<string, Error>> => {
	const latestVideoResult = await fetchLatestYouTubeVideo(uploadsPlaylistId)
	if (latestVideoResult.isErr()) {
		return err(latestVideoResult.error)
	}

	const videoId = latestVideoResult.value.contentDetails.videoId
	return ok(videoId)
}

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, videoId: string): Promise<void> => {
	try {
		// サーバーを取得
		const guild = await client.guilds.fetch(DISCORD_GUILD_ID)
		// チャンネルを取得
		const channel = await guild.channels.fetch(DISCORD_VIDEOS_CHANNEL_ID)
		// チャンネルが見つからない場合はエラーを出力
		if (!channel) {
			return console.error('指定されたチャンネルが見つかりませんでした')
		}
		if (channel.isTextBased()) {
			await channel.send({
				content: `@everyone 新しい動画が投稿されました！\nhttps://www.youtube.com/watch?v=${videoId}`,
			})
			console.log('YouTube動画通知を送信しました')
		} else {
			console.error('指定されたチャンネルIDはテキストチャンネルではありません')
		}
	} catch (error) {
		console.error('YouTube動画通知送信エラー:', (error as Error).message)
	}
}
