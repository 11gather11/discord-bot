import { type Client, Events } from 'discord.js'
import { monitorExistingChannels } from '@/events/voice-state-update'
import { logger } from '@/lib/logger'
import { updateMemberCounts } from '@/services/memberCounts'
import { startTwitchLiveNotification } from '@/services/twitch'
import { startYouTubeVideoNotification } from '@/services/youtube'
import type { Event } from '@/types/event'

const { YOUTUBE_CHANNEL_ID } = process.env
if (!YOUTUBE_CHANNEL_ID) {
	throw new Error('環境変数が設定されていません')
}

export default {
	name: Events.ClientReady,
	once: true,

	execute: async (client: Client) => {
		logger.info(`ログイン成功: ${client.user?.tag}`)
		try {
			updateMemberCounts(client)
			monitorExistingChannels(client)
			await Promise.all([
				startTwitchLiveNotification(client, 'vvvmeovvv'),
				startYouTubeVideoNotification(client, YOUTUBE_CHANNEL_ID),
			])
		} catch (error) {
			logger.error(error)
		}
	},
} satisfies Event<Events.ClientReady>
