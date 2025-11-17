import { type Client, EmbedBuilder, TextChannel } from 'discord.js'
import { logger } from '@/lib/logger'
import { fetchAccessToken, fetchGameInfo, fetchStreamingStatus, isAccessTokenValid } from '@/lib/twitch'
import { tweet } from '@/services/twitter'
import type { TwitchGame, TwitchStream } from '@/types/twitch'

const CHECK_INTERVAL = 1000 * 60
const TWITCH_COLOR = 0x9146ff
const TWITCH_BASE_URL = 'https://www.twitch.tv'
const TWITCH_FAVICON = 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/144x192.png?text=No+Image'

const getDiscordConfig = (): { guildId: string; channelId: string } => {
	const guildId = import.meta.env.DISCORD_GUILD_ID
	const channelId = import.meta.env.DISCORD_STREAMS_CHANNEL_ID
	if (!(guildId && channelId)) {
		throw new Error('[Twitch] DISCORD_GUILD_ID and DISCORD_STREAMS_CHANNEL_ID are not set')
	}
	return { guildId, channelId }
}

const buildStreamEmbed = (userLogin: string, stream: TwitchStream, game: TwitchGame | undefined): EmbedBuilder => {
	const { user_name, title, viewer_count, started_at, thumbnail_url } = stream
	const startedAt = new Date(started_at).toLocaleString('ja-JP')
	const gameName = game?.name || '不明'
	const gameImageUrl = game?.box_art_url?.replace('{width}', '144').replace('{height}', '192') || PLACEHOLDER_IMAGE
	const thumbnailUrl = thumbnail_url.replace('{width}', '640').replace('{height}', '360')

	return new EmbedBuilder()
		.setColor(TWITCH_COLOR)
		.setTitle(title)
		.setURL(`${TWITCH_BASE_URL}/${userLogin}`)
		.setAuthor({ name: user_name, url: `${TWITCH_BASE_URL}/${userLogin}` })
		.setThumbnail(gameImageUrl)
		.addFields(
			{ name: '👥 視聴者数', value: viewer_count.toString(), inline: true },
			{ name: '🎮 ゲーム', value: gameName, inline: true },
		)
		.setImage(thumbnailUrl)
		.setFooter({ text: `配信開始: ${startedAt}`, iconURL: TWITCH_FAVICON })
}

const buildTweetText = (userLogin: string, stream: TwitchStream, gameName: string): string => {
	const { user_name, title } = stream
	return `${user_name}がTwitchで配信を開始しました! \n\n🎮 ゲーム: ${gameName}\n📺 タイトル: ${title}\n\n視聴はこちら: ${TWITCH_BASE_URL}/${userLogin} \n\n#Twitch #配信 #${gameName}`
}

const sendToDiscord = async (
	client: Client,
	guildId: string,
	channelId: string,
	embed: EmbedBuilder,
	message: string,
): Promise<void> => {
	try {
		const guild = await client.guilds.fetch(guildId)
		const channel = await guild.channels.fetch(channelId)
		if (!(channel instanceof TextChannel)) {
			throw new Error('[Twitch] Channel is not a text channel')
		}
		await channel.send({ content: message, embeds: [embed] })
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`[Twitch] Failed to send Discord message: ${errorMessage}`)
	}
}

const notifyStream = async (
	client: Client,
	userLogin: string,
	stream: TwitchStream,
	game: TwitchGame | undefined,
): Promise<void> => {
	try {
		const { guildId, channelId } = getDiscordConfig()
		const embed = buildStreamEmbed(userLogin, stream, game)
		const gameName = game?.name || '不明'
		const discordMessage = `@everyone ${stream.user_name}がTwitchで配信を開始しました!`
		const tweetText = buildTweetText(userLogin, stream, gameName)

		await Promise.all([sendToDiscord(client, guildId, channelId, embed, discordMessage), tweet(tweetText)])
		logger.info(`[Twitch] ${userLogin} の配信開始を検知: ${stream.title}`)
	} catch (error) {
		logger.error('[Twitch] Failed to send stream notification:', error as Error)
	}
}

const handleNotification = async (
	client: Client,
	userLogin: string,
	accessToken: string,
	notified: boolean,
): Promise<boolean> => {
	const stream = await fetchStreamingStatus(accessToken, userLogin)

	if (stream && !notified) {
		const game = await fetchGameInfo(accessToken, stream.game_id)
		await notifyStream(client, userLogin, stream, game)
		return true
	}

	return stream ? notified : false
}

const checkStatus = async (
	client: Client,
	userLogin: string,
	accessToken: string,
	notified: boolean,
): Promise<void> => {
	try {
		const isValid = await isAccessTokenValid(accessToken)
		const currentToken = isValid ? accessToken : await fetchAccessToken()
		const newNotified = await handleNotification(client, userLogin, currentToken, notified)

		setTimeout(() => {
			checkStatus(client, userLogin, currentToken, newNotified)
		}, CHECK_INTERVAL)
	} catch (error) {
		logger.error('[Twitch] Failed to check stream status:', error as Error)
	}
}

export const startLiveNotification = async (client: Client, userLogin: string): Promise<void> => {
	try {
		const accessToken = await fetchAccessToken()
		logger.info(`配信状況の監視を開始しました: ${userLogin}`)
		await checkStatus(client, userLogin, accessToken, false)
	} catch (error) {
		logger.error('[Twitch] Failed to start live notification:', error as Error)
	}
}
