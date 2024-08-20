import {
	ChannelType,
	type ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type VoiceChannel,
} from 'discord.js'

// 環境変数
const { DISCORD_FREE_VOICE_CHANNEL_ID } = process.env

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
			.setMaxLength(10)
	)
	.addNumberOption((option) =>
		option
			.setName('人数')
			.setDescription('作成するボイスチャンネルの人数上限を入力してください。')
			.setRequired(false)
			.setMinValue(2)
			.setMaxValue(99)
	)

// 開発環境の場合、デフォルトの権限を設定
if (process.env.NODE_ENV === 'development') {
	data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
}

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	// コマンド実行者を取得
	const member = interaction.guild?.members.cache.get(interaction.user.id)?.displayName

	const name = interaction.options.getString('名前') ?? `🔊${member}のVC`
	const userLimit = interaction.options.getNumber('人数') ?? undefined

	// ボイスチャンネルの作成
	const voiceChannel = (await interaction.guild?.channels.create({
		name: name,
		type: ChannelType.GuildVoice,
		userLimit: userLimit,
		parent: DISCORD_FREE_VOICE_CHANNEL_ID,
	})) as VoiceChannel

	if (!voiceChannel) {
		// エラーメッセージを埋め込みで表示
		const errorEmbed = new EmbedBuilder()
			.setTitle('⛔️エラー')
			.setDescription('チャンネルの作成中に問題が発生しました。')
			.setColor(0xff0000) // 赤色

		await interaction.reply({
			embeds: [errorEmbed],
			ephemeral: true,
		})
		return
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

	// 10分間の監視を開始
	const checkInterval = setInterval(
		async () => {
			// VCが削除された場合
			if (!interaction.guild?.channels.cache.has(voiceChannel.id)) {
				clearInterval(checkInterval) // 監視の停止
				return
			}
			// VCに誰もいない場合
			if (voiceChannel.members.size === 0) {
				clearInterval(checkInterval) // 監視の停止

				// VCを削除
				await voiceChannel.delete()
			}
		},
		3 * 60 * 1000
	) // 3分
}
