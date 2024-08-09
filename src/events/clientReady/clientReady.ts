import { type Client, Events } from 'discord.js'
import { startTwitchLiveNotification } from '../../lib/twitch'

export const name = Events.ClientReady

export const once = true

export const execute = (client: Client) => {
	console.log(`ログイン成功: ${client.user?.tag}`)
	startTwitchLiveNotification(client, 'vvvmeovvv')
}
