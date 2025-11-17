import type { Client } from 'discord.js'
import { logger } from '@/lib/logger'
import { fetchLatestVideo, fetchUploadsPlaylistId } from '@/lib/youtube'

const CHECK_INTERVAL = 1000 * 60 * 20
const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v='

const getDiscordConfig = (): { guildId: string; channelId: string } => {
	const guildId = import.meta.env.DISCORD_GUILD_ID
	const channelId = import.meta.env.DISCORD_VIDEOS_CHANNEL_ID
	if (!(guildId && channelId)) {
		throw new Error('[YouTube] DISCORD_GUILD_ID and DISCORD_VIDEOS_CHANNEL_ID are not set')
	}
	return { guildId, channelId }
}

const initVideoId = async (uploadsPlaylistId: string): Promise<string> => {
	const latestVideo = await fetchLatestVideo(uploadsPlaylistId)
	return latestVideo.contentDetails.videoId
}

const sendToDiscord = async (client: Client, guildId: string, channelId: string, videoId: string): Promise<void> => {
	try {
		const guild = await client.guilds.fetch(guildId)
		const channel = await guild.channels.fetch(channelId)
		if (!channel) {
			throw new Error('[YouTube] Channel not found')
		}
		if (!channel.isTextBased()) {
			throw new Error('[YouTube] Channel is not a text channel')
		}
		await channel.send({
			content: `@everyone 新しい動画が投稿されました！\n${YOUTUBE_BASE_URL}${videoId}`,
		})
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`[YouTube] Failed to send Discord message: ${errorMessage}`)
	}
}

const notifyVideo = async (client: Client, videoId: string): Promise<void> => {
	try {
		const { guildId, channelId } = getDiscordConfig()
		await sendToDiscord(client, guildId, channelId, videoId)
		logger.info(`[YouTube] 新しい動画を検知: ${YOUTUBE_BASE_URL}${videoId}`)
	} catch (error) {
		logger.error('[YouTube] Failed to send video notification:', error as Error)
	}
}

const handleNotification = async (client: Client, uploadsPlaylistId: string, lastVideoId: string): Promise<string> => {
	const latestVideo = await fetchLatestVideo(uploadsPlaylistId)
	const videoId = latestVideo.contentDetails.videoId

	if (lastVideoId !== videoId) {
		await notifyVideo(client, videoId)
		return videoId
	}
	return lastVideoId
}

const checkStatus = (client: Client, uploadsPlaylistId: string, lastVideoId: string): void => {
	setTimeout(async () => {
		try {
			const newVideoId = await handleNotification(client, uploadsPlaylistId, lastVideoId)
			checkStatus(client, uploadsPlaylistId, newVideoId)
		} catch (error) {
			logger.error('[YouTube] Failed to check video status:', error as Error)
		}
	}, CHECK_INTERVAL)
}

export const startVideoNotification = async (client: Client, channelId: string): Promise<void> => {
	try {
		const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)
		const lastVideoId = await initVideoId(uploadsPlaylistId)
		checkStatus(client, uploadsPlaylistId, lastVideoId)
		logger.info(`動画投稿の監視を開始しました: ${channelId}`)
	} catch (error) {
		logger.error('[YouTube] Failed to start video notification:', error as Error)
	}
}
