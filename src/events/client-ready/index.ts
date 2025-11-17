import { type Client, Events } from 'discord.js'
import { loadServicesConfig } from '@/config'
import { monitorExistingChannels } from '@/events/voice-state-update'
import { logger } from '@/lib/logger'
import { updateMemberCounts } from '@/services/memberCounts'
import { startTwitchLiveNotification } from '@/services/twitch'
import { startYouTubeVideoNotification } from '@/services/youtube'
import type { Event } from '@/types/event'

export default {
	name: Events.ClientReady,
	once: true,

	execute: async (client: Client) => {
		logger.info(`ログイン成功: ${client.user?.tag}`)
		try {
			// 設定ファイルから読み込み
			const config = loadServicesConfig()

			updateMemberCounts(client)
			monitorExistingChannels(client)

			// Twitchチャンネルの監視を開始
			const twitchPromises = config.twitch.channels.map((channel) => startTwitchLiveNotification(client, channel))

			// YouTubeチャンネルの監視を開始
			const youtubePromises = config.youtube.channelIds.map((channelId) =>
				startYouTubeVideoNotification(client, channelId),
			)

			await Promise.all([...twitchPromises, ...youtubePromises])
		} catch (error) {
			logger.error(error)
		}
	},
} satisfies Event<Events.ClientReady>
