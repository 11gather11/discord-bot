import { ChannelType, type Client } from 'discord.js'
import { logger } from '@/lib/logger'

const CHECK_INTERVAL = 1000 * 60 * 10
const MEMBER_COUNT_FORMAT = (count: number) => `👥 メンバー数:${count}`

const getDiscordConfig = (): { guildId: string; channelId: string } | null => {
	const guildId = import.meta.env.DISCORD_GUILD_ID
	const channelId = import.meta.env.DISCORD_MEMBER_COUNT_CHANNEL_ID

	if (!(guildId && channelId)) {
		return null
	}

	return { guildId, channelId }
}

const getNonBotMemberCount = async (client: Client, guildId: string): Promise<number> => {
	const guild = await client.guilds.fetch(guildId)
	const members = await guild.members.fetch()
	return members.filter((member) => !member.user.bot).size
}

const updateChannelName = async (client: Client, guildId: string, channelId: string): Promise<void> => {
	const guild = await client.guilds.fetch(guildId)
	const channel = await guild.channels.fetch(channelId)

	if (!channel) {
		throw new Error('[MemberCounts] Channel not found')
	}
	if (channel.type !== ChannelType.GuildVoice) {
		throw new Error('[MemberCounts] Channel is not a voice channel')
	}

	const memberCount = await getNonBotMemberCount(client, guildId)
	const newChannelName = MEMBER_COUNT_FORMAT(memberCount)
	await channel.setName(newChannelName)
}

const updateCount = async (client: Client): Promise<void> => {
	const config = getDiscordConfig()
	if (!config) {
		logger.warn('[MemberCounts] DISCORD_GUILD_ID and DISCORD_MEMBER_COUNT_CHANNEL_ID are not set, skipping update')
		return
	}

	try {
		await updateChannelName(client, config.guildId, config.channelId)
		logger.info('[MemberCounts] Member count updated successfully')
	} catch (error) {
		logger.error('[MemberCounts] Failed to update member count:', error as Error)
	}
}

const checkStatus = (client: Client): void => {
	setTimeout(async () => {
		await updateCount(client)
		checkStatus(client)
	}, CHECK_INTERVAL)
}

export const update = async (client: Client): Promise<void> => {
	try {
		await updateCount(client)
		checkStatus(client)
		logger.info('[MemberCounts] Started monitoring member count updates')
	} catch (error) {
		logger.error('[MemberCounts] Failed to start member count updates:', error as Error)
	}
}
