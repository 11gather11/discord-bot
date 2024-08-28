import { sendErrorReply } from '@/utils/sendErrorReply'
import {
	ChannelType,
	type ChatInputCommandInteraction,
	type Client,
	EmbedBuilder,
	SlashCommandBuilder,
	type VoiceChannel,
} from 'discord.js'

// 環境変数
const { DISCORD_FREE_VOICE_CHANNEL_ID } = process.env

if (!DISCORD_FREE_VOICE_CHANNEL_ID) {
	throw new Error('環境変数が設定されていません')
}

export const cooldown = 10 // 10秒

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('create_free_channels')
	.setDescription('フリーチャンネルを作成します。')
	.addStringOption((option) =>
		option
			.setName('名前')
			.setDescription('作成するチャンネルの名前を入力してください。')
			.setRequired(false)
			.setMinLength(5)
			.setMaxLength(20)
	)
	.addNumberOption((option) =>
		option
			.setName('人数')
			.setDescription('作成するボイスチャンネルの人数上限を入力してください。')
			.setRequired(false)
			.setMinValue(2)
			.setMaxValue(99)
	)

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	// コマンド実行者を取得
	const guild = interaction.guild
	if (!guild) {
		return await sendErrorReply(interaction, 'サーバーが見つかりませんでした。')
	}
	const member = await guild.members.fetch(interaction.user.id)
	if (!member) {
		return await sendErrorReply(interaction, 'メンバーが見つかりませんでした。')
	}
	const user = member.displayName

	const name = `🔊${interaction.options.getString('名前') ?? `${user}のVC`}`
	const userLimit = interaction.options.getNumber('人数') ?? undefined

	// ボイスチャンネルの作成
	const voiceChannel = (await interaction.guild?.channels.create({
		name: name,
		type: ChannelType.GuildVoice,
		userLimit: userLimit,
		parent: DISCORD_FREE_VOICE_CHANNEL_ID,
	})) as VoiceChannel

	if (!voiceChannel) {
		return await sendErrorReply(interaction, 'チャンネルの作成に失敗しました。')
	}

	const voiceChannelUrl = `https://discord.com/channels/${interaction.guildId}/${voiceChannel.id}`

	// 埋め込みメッセージとして表示
	const embed = new EmbedBuilder()
		.setTitle('🗽フリーチャンネルを作成しました')
		.setDescription(`[こちら](${voiceChannelUrl}) から参加してください。`)
		.setColor(0x00ae86) // 緑色

	await interaction.reply({
		embeds: [embed],
		ephemeral: true,
	})

	// ボイスチャンネルを監視
	startVoiceChannelMonitoring(voiceChannel)
}

// ボットが起動した際に、既存のチャンネルを監視
export const monitorExistingChannels = async (client: Client) => {
	// 指定されたカテゴリ内のチャンネルを取得
	const categoryChannel = await client.channels.fetch(DISCORD_FREE_VOICE_CHANNEL_ID)
	if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
		return console.error('カテゴリが見つかりません')
	}

	const voiceChannels = categoryChannel.children.cache.filter(
		(channel) => channel.type === ChannelType.GuildVoice
	) as Map<string, VoiceChannel>

	// 各ボイスチャンネルを監視
	for (const voiceChannel of voiceChannels.values()) {
		startVoiceChannelMonitoring(voiceChannel)
	}
	console.log(`フリーボイスチャンネルを再監視: ${voiceChannels.size}個`)
}

// ボイスチャンネルを監視して、メンバーがいなくなったら削除
const startVoiceChannelMonitoring = (voiceChannel: VoiceChannel) => {
	const checkInterval = setInterval(
		async () => {
			if (!voiceChannel.guild.channels.cache.has(voiceChannel.id)) {
				clearInterval(checkInterval) // チャンネルが存在しない場合、監視を停止
				return console.log(
					'フリーチャンネルを削除しようとしましたが、チャンネルが見つかりませんでした'
				)
			}

			if (voiceChannel.members.size === 0) {
				clearInterval(checkInterval) // 監視の停止

				// チャンネルを削除
				await voiceChannel.delete()
			}
		},
		5 * 60 * 1000
	) // 5分ごとにチェック
}
