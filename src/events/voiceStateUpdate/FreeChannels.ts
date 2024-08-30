import { ChannelType, type Client, Events, type VoiceChannel, type VoiceState } from 'discord.js'

const { DISCORD_FREE_VOICE_CHANNEL_ID, DISCORD_FREE_VOICE_CATEGORY_ID } = process.env

if (!(DISCORD_FREE_VOICE_CHANNEL_ID && DISCORD_FREE_VOICE_CATEGORY_ID)) {
	throw new Error('環境変数が設定されていません')
}

// イベント名をVoiceStateUpdateに設定
export const name = Events.VoiceStateUpdate

// イベントが発生した際に実行される関数
export const execute = async (oldState: VoiceState, newState: VoiceState) => {
	// ユーザーが指定されたチャンネルに参加しているか確認
	if (oldState && newState.channelId !== DISCORD_FREE_VOICE_CHANNEL_ID) {
		return
	}

	const guild = newState.guild

	// 新しい一時的なボイスチャンネルを作成
	const voiceChannel = await guild.channels.create({
		name: `🔊${newState.member?.user.displayName}のVC`, // チャンネル名をユーザー名に基づいて設定
		type: ChannelType.GuildVoice, // チャンネルタイプをボイスチャンネルに設定
		parent: DISCORD_FREE_VOICE_CATEGORY_ID, // 親カテゴリを設定
	})

	// ユーザーを新しく作成したボイスチャンネルに移動
	await newState.member?.voice.setChannel(voiceChannel)

	// チャンネルが空になったら削除するための監視関数
	const checkChannel = async (updatedOldState: VoiceState, updatedNewState: VoiceState) => {
		// ユーザーがチャンネルを離れ、かつチャンネルが空であるか確認
		if (
			updatedOldState &&
			updatedNewState.channelId !== voiceChannel.id &&
			voiceChannel.members.size === 0
		) {
			// チャンネルを削除
			await voiceChannel.delete()
			// イベントリスナーを解除
			newState.client.off(Events.VoiceStateUpdate, checkChannel)
		}
	}

	// VoiceStateUpdateイベントが発生したら、checkChannel関数を呼び出すリスナーを設定
	newState.client.on(Events.VoiceStateUpdate, checkChannel)
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

	// 各ボイスチャンネルを監視
	for (const voiceChannel of voiceChannels.values()) {
		// チャンネルが空である場合は即座に削除
		if (voiceChannel.members.size === 0) {
			await voiceChannel.delete()
			console.log(`空のチャンネルを削除しました: ${voiceChannel.name}`)
		} else {
			// チャンネルが空ではない場合、監視を開始
			startVoiceChannelMonitoring(voiceChannel, client)
		}
	}
	console.log(`フリーボイスチャンネルを再監視: ${voiceChannels.size}個`)
}

// 既存のボイスチャンネルの監視を開始する関数
const startVoiceChannelMonitoring = (voiceChannel: VoiceChannel, client: Client) => {
	const checkChannel = async (oldState: VoiceState, newState: VoiceState) => {
		if (oldState && newState.channelId !== voiceChannel.id && voiceChannel.members.size === 0) {
			await voiceChannel.delete()
			client.off(Events.VoiceStateUpdate, checkChannel)
		}
	}

	client.on(Events.VoiceStateUpdate, checkChannel)
}
