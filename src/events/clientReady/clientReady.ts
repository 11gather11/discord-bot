import { deployCommands } from '@/deploy-commands'
import { monitorExistingChannels } from '@/events/voiceStateUpdate/freeChannels'
import { startTwitchLiveNotification } from '@/services/twitch'
import { startYouTubeVideoNotification } from '@/services/youtube'
import { updateMemberCounts } from '@/utils/memberCounts'
import { type Client, Events } from 'discord.js'

const { YOUTUBE_CHANNEL_ID } = process.env
if (!YOUTUBE_CHANNEL_ID) {
	throw new Error('環境変数が設定されていません')
}

export const name = Events.ClientReady

export const once = true

export const execute = async (client: Client) => {
	console.log(`ログイン成功: ${client.user?.tag}`)
	try {
		await deployCommands()
		await startTwitchLiveNotification(client, 'vvvmeovvv')
		await startYouTubeVideoNotification(client, YOUTUBE_CHANNEL_ID)
		await updateMemberCounts(client)
		await monitorExistingChannels(client)
	} catch (error) {
		console.error(error)
	}
}
