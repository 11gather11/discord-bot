import { logger } from '@/helpers/Logger'
import { ChannelType, type Client, Events, type VoiceChannel, type VoiceState } from 'discord.js'

const { DISCORD_FREE_VOICE_CHANNEL_ID, DISCORD_FREE_VOICE_CATEGORY_ID } = process.env

if (!(DISCORD_FREE_VOICE_CHANNEL_ID && DISCORD_FREE_VOICE_CATEGORY_ID)) {
	throw new Error('環境変数が設定されていません')
}

// イベント名をVoiceStateUpdateに設定
export const name = Events.VoiceStateUpdate

// イベントが発生した際に実行される関数
export const execute = (oldState: VoiceState, newState: VoiceState) => {
	// 新しい一時チャンネルの作成
	createNewVoiceChannel(newState)
	// 空のチャンネルの削除
	deleteEmptyChannel(oldState)
}

const createNewVoiceChannel = async (newState: VoiceState) => {
	// フリー作成チャンネル以外の場合は処理を終了
	if (newState.channelId !== DISCORD_FREE_VOICE_CHANNEL_ID) {
		return
	}

	const guild = newState.guild
	const newVoiceChannel = await guild.channels.create({
		name: `🔊${newState.member?.user.displayName}のVC`,
		type: ChannelType.GuildVoice,
		parent: DISCORD_FREE_VOICE_CATEGORY_ID,
	})
	await newState.member?.voice.setChannel(newVoiceChannel)
}

const deleteEmptyChannel = async (oldState: VoiceState) => {
	// チャンネルを取得
	const channel = oldState.channel
	if (!channel) {
		return
	}
	// チャンネルがフリー作成チャンネルまたはフリーカテゴリー以外の場合は処理を終了
	if (
		channel.id === DISCORD_FREE_VOICE_CHANNEL_ID ||
		channel.parentId !== DISCORD_FREE_VOICE_CATEGORY_ID
	) {
		return
	}
	// チャンネルに誰もいない場合は削除
	if (channel.members.size === 0) {
		await channel.delete()
	}
}

// ボット起動時に既存のチャンネルを監視するための関数
export const monitorExistingChannels = async (client: Client) => {
	// 指定されたカテゴリ内のチャンネルを取得
	const categoryChannel = await client.channels.fetch(DISCORD_FREE_VOICE_CATEGORY_ID)
	if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
		logger.error('カテゴリが見つかりません')
		return
	}
	// カテゴリ内のボイスチャンネルをフィルタリング
	const voiceChannels = categoryChannel.children.cache.filter(
		(channel) =>
			channel.type === ChannelType.GuildVoice && channel.id !== DISCORD_FREE_VOICE_CHANNEL_ID
	) as Map<string, VoiceChannel>

	// 各ボイスチャンネルをチェック
	for (const voiceChannel of voiceChannels.values()) {
		if (voiceChannel.members.size === 0) {
			await voiceChannel.delete()
		}
	}
	logger.success(`フリーボイスチャンネルを再監視: ${voiceChannels.size}個`)
}
