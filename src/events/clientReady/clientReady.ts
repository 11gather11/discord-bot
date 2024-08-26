import { deployCommands } from '@/deploy-commands'
import { type Client, Events } from 'discord.js'
import { startTwitchLiveNotification } from '../../lib/twitch'
import { startYouTubeVideoNotification } from '../../lib/youtube'
import { updateMemberCounts } from '../../utils/memberCounts'

const { YOUTUBE_CHANNEL_ID } = process.env
if (!YOUTUBE_CHANNEL_ID) {
	console.error('環境変数が設定されていません')
	process.exit(1)
}

export const name = Events.ClientReady

export const once = true

export const execute = async (client: Client) => {
	console.log(`ログイン成功: ${client.user?.tag}`)
	await deployCommands()
	startTwitchLiveNotification(client, 'vvvmeovvv')
	startYouTubeVideoNotification(client, YOUTUBE_CHANNEL_ID)
	updateMemberCounts(client)
}
