import { monitorExistingChannels } from '@/events/voiceStateUpdate'
import { logger } from '@/helpers/logger'
import { startTwitchLiveNotification } from '@/services/twitch'
import { startYouTubeVideoNotification } from '@/services/youtube'
import type { BotEvent } from '@/types/client'
import { updateMemberCounts } from '@/utils/memberCounts'
import { type Client, Events } from 'discord.js'

const { YOUTUBE_CHANNEL_ID, DISCORD_GUILD_ID, DISCORD_LOG_CHANNEL_ID } = process.env
if (!(YOUTUBE_CHANNEL_ID && DISCORD_GUILD_ID && DISCORD_LOG_CHANNEL_ID)) {
	throw new Error('環境変数が設定されていません')
}

const event: BotEvent = {
	name: Events.ClientReady,
	once: true,

	execute: async (client: Client) => {
		logger.success(`ログイン成功: ${client.user?.tag}`)
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
}

export default event
