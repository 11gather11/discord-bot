import { type Client, Events } from 'discord.js'
import { startTwitchLiveNotification } from '../../lib/twitch'
import { startYouTubeVideoNotification } from '../../lib/youtube'
import { updateMemberCounts } from '../../utils/memberCounts'
import 'dotenv/config'

const { YOUTUBE_CHANNEL_ID } = process.env

export const name = Events.ClientReady

export const once = true

export const execute = (client: Client) => {
	console.log(`ログイン成功: ${client.user?.tag}`)
	startTwitchLiveNotification(client, 'vvvmeovvv')
	startYouTubeVideoNotification(client, YOUTUBE_CHANNEL_ID as string)
	updateMemberCounts(client)
}
