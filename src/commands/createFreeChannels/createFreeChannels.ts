import {
	type CategoryChannel,
	ChannelType,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type TextChannel,
	type VoiceChannel,
} from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('create_free_channels')
	.setDescription('フリーチャンネルを作成します。')
	.addStringOption((option) =>
		option
			.setName('名前')
			.setDescription('作成するチャンネルの名前を入力してください。')
			.setRequired(true)
	)

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	const categoryName = interaction.options.getString('名前') ?? 'Free'

	// カテゴリーを作成
	const category = (await interaction.guild?.channels.create({
		name: categoryName,
		type: ChannelType.GuildCategory,
	})) as CategoryChannel

	// テキストチャンネルの作成
	const textChannel = (await interaction.guild?.channels.create({
		name: 'TEXT',
		type: ChannelType.GuildText,
		parent: category.id,
	})) as TextChannel

	// ボイスチャンネルの作成
	const voiceChannel = (await interaction.guild?.channels.create({
		name: 'VC',
		type: ChannelType.GuildVoice,
		parent: category.id,
	})) as VoiceChannel

	await interaction.reply({
		content: `カテゴリー「${category.name}」を作成しました。\nテキストチャンネル「${textChannel.name}」を作成しました。\nボイスチャンネル「${voiceChannel.name}」を作成しました。`,
		ephemeral: true,
	})

	// 10分間
}
