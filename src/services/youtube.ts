import type { Client } from 'discord.js'
import { logger } from '@/lib/logger'
import { fetchLatestYouTubeVideo, fetchUploadsPlaylistId } from '@/lib/youtube'

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
export const startYouTubeVideoNotification = async (client: Client, channelId: string): Promise<void> => {
	try {
		// 起動時にプレイリストIDを取得
		const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)

		// 最新動画IDを取得
		const lastVideoId = await initLastVideoId(uploadsPlaylistId)

		// 最新動画IDを元に新しい動画をチェック
		checkForNewVideos(client, uploadsPlaylistId, lastVideoId)

		// 動画投稿の監視を開始
		logger.info(`YouTube動画投稿の監視を開始しました: ${channelId}`)
	} catch (error) {
		logger.error(error as Error)
	}
}

/**
 * 新しい動画をチェックして通知を送信
 * @param {Client} client Discordクライアント
 * @param {string} uploadsPlaylistId アップロードプレイリストID
 * @param {string} lastVideoId 最新動画ID
 * @returns {void}
 */
const checkForNewVideos = (client: Client, uploadsPlaylistId: string, lastVideoId: string) => {
	// 20分ごとにチェック
	const timer = 1000 * 60 * 20
	setTimeout(async () => {
		try {
			const newLastVideoId = await handleYouTubeVideoNotification(client, uploadsPlaylistId, lastVideoId)
			checkForNewVideos(client, uploadsPlaylistId, newLastVideoId)
		} catch (error) {
			logger.error(error as Error)
		}
	}, timer)
}

/**
 * YouTubeの新しい動画をチェックして通知を送信その後最新動画IDを返す
 * @param {Client} client Discordクライアント
 * @param {string} uploadsPlaylistId アップロードプレイリストID
 * @param {string} lastVideoId 最新動画ID
 * @returns {Promise<string>} 最新動画ID
 */
const handleYouTubeVideoNotification = async (
	client: Client,
	uploadsPlaylistId: string,
	lastVideoId: string,
): Promise<string> => {
	const latestVideo = await fetchLatestYouTubeVideo(uploadsPlaylistId)
	const videoId = latestVideo.contentDetails.videoId

	if (lastVideoId !== videoId) {
		await sendYouTubeVideoNotification(client, videoId)
		return videoId
	}
	return lastVideoId
}

// 初期化関数：起動時に最新動画IDを保存
const initLastVideoId = async (uploadsPlaylistId: string): Promise<string> => {
	const latestVideo = await fetchLatestYouTubeVideo(uploadsPlaylistId)
	return latestVideo.contentDetails.videoId
}

// YouTubeの新しい動画の通知を送信
const sendYouTubeVideoNotification = async (client: Client, videoId: string): Promise<void> => {
	// サーバーを取得
	const guild = await client.guilds.fetch(DISCORD_GUILD_ID)
	// チャンネルを取得
	const channel = await guild.channels.fetch(DISCORD_VIDEOS_CHANNEL_ID)
	// チャンネルが見つからない場合はエラーを出力
	if (!channel) {
		logger.error('指定されたチャンネルが見つかりませんでした')
		return
	}
	if (channel.isTextBased()) {
		try {
			await channel.send({
				content: `@everyone 新しい動画が投稿されました！\nhttps://www.youtube.com/watch?v=${videoId}`,
			})
		} catch (error) {
			logger.error('動画の通知に失敗しました:', (error as Error).message)
		}
	} else {
		logger.error('指定されたチャンネルIDはテキストチャンネルではありません')
	}
}
