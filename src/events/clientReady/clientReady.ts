import { deployCommands } from '@/deployCommands'
import { monitorExistingChannels } from '@/events/voiceStateUpdate/freeChannels'
import { startTwitchLiveNotification } from '@/services/twitch'
import { startYouTubeVideoNotification } from '@/services/youtube'
import { updateMemberCounts } from '@/utils/memberCounts'
import { overrideConsole } from '@/utils/overrideConsole'
import { type Client, Events } from 'discord.js'

const { YOUTUBE_CHANNEL_ID, DISCORD_GUILD_ID, DISCORD_LOG_CHANNEL_ID } = process.env
if (!(YOUTUBE_CHANNEL_ID && DISCORD_GUILD_ID && DISCORD_LOG_CHANNEL_ID)) {
	throw new Error('環境変数が設定されていません')
}

export const name = Events.ClientReady

export const once = true

export const execute = async (client: Client) => {
	await overrideConsole(client, DISCORD_GUILD_ID, DISCORD_LOG_CHANNEL_ID)
	console.info(`ログイン成功: ${client.user?.tag}`)
	try {
		await deployCommands()
		updateMemberCounts(client)
		monitorExistingChannels(client)
		await Promise.all([
			startTwitchLiveNotification(client, 'vvvmeovvv'),
			startYouTubeVideoNotification(client, YOUTUBE_CHANNEL_ID),
		])
	} catch (error) {
		console.error(error)
	}
}
