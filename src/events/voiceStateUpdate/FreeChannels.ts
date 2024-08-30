import { ChannelType, type Client, Events, type VoiceChannel, type VoiceState } from 'discord.js'

const { DISCORD_FREE_VOICE_CHANNEL_ID, DISCORD_FREE_VOICE_CATEGORY_ID } = process.env

if (!(DISCORD_FREE_VOICE_CHANNEL_ID && DISCORD_FREE_VOICE_CATEGORY_ID)) {
	throw new Error('環境変数が設定されていません')
}

// イベント名をVoiceStateUpdateに設定
export const name = Events.VoiceStateUpdate

// イベントが発生した際に実行される関数
export const execute = (oldState: VoiceState, newState: VoiceState) => {
	// グローバルに管理するリスナーでチャンネルの状態をチェック
	checkVoiceChannel(oldState, newState)
}

// チャンネルの状態をチェックする関数
const checkVoiceChannel = async (oldState: VoiceState, newState: VoiceState) => {
	// チャンネルが一時チャンネルでない、または指定されたチャンネルでない場合は終了
	if (
		!oldState.channelId &&
		(newState.channelId !== DISCORD_FREE_VOICE_CHANNEL_ID || !newState.channel)
	) {
		return
	}

	// 新しい一時チャンネルの作成
	if (newState.channelId === DISCORD_FREE_VOICE_CHANNEL_ID) {
		const guild = newState.guild

		const newVoiceChannel = await guild.channels.create({
			name: `🔊${newState.member?.user.displayName}のVC`,
			type: ChannelType.GuildVoice,
			parent: DISCORD_FREE_VOICE_CATEGORY_ID,
		})

		await newState.member?.voice.setChannel(newVoiceChannel)
		return
	}

	// 既存チャンネルの監視
	if (oldState.channelId && oldState.channelId !== DISCORD_FREE_VOICE_CHANNEL_ID) {
		const oldChannel = oldState.channel as VoiceChannel
		if (oldChannel.members.size === 0) {
			await oldChannel.delete()
		}
	}
}

// ボット起動時に既存のチャンネルを監視するための関数
export const monitorExistingChannels = async (client: Client) => {
	// 指定されたカテゴリ内のチャンネルを取得
	const categoryChannel = await client.channels.fetch(DISCORD_FREE_VOICE_CATEGORY_ID)
	if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
		return console.error('カテゴリが見つかりません')
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
	console.log(`フリーボイスチャンネルを再監視: ${voiceChannels.size}個`)
}
