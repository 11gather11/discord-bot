import { sendErrorReply } from '@/utils/sendErrorReply'
import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	type GuildMember,
	SlashCommandBuilder,
} from 'discord.js'

// 環境変数
const { DISCORD_FREE_VOICE_CHANNEL_ID, DISCORD_FREE_VOICE_CATEGORY_ID } = process.env

if (!(DISCORD_FREE_VOICE_CHANNEL_ID && DISCORD_FREE_VOICE_CATEGORY_ID)) {
	throw new Error('環境変数が設定されていません')
}

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('フリーチャンネル')
	.setDescription('フリーチャンネルの設定コマンドです。')
	.addSubcommand((subcommand) =>
		subcommand
			.setName('名前変更')
			.setDescription('フリーチャンネルの名前を変更します。')
			.addStringOption((option) =>
				option
					.setName('名前')
					.setDescription('新しい名前を入力してください。')
					.setRequired(true)
					.setMinLength(5)
					.setMaxLength(30)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName('人数制限')
			.setDescription('フリーチャンネルの人数制限を設定します。')
			.addIntegerOption((option) =>
				option
					.setName('人数')
					.setDescription('人数制限を入力してください。(0で制限なし)')
					.setRequired(true)
					.setMinValue(0)
					.setMaxValue(99)
			)
	)

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction) => {
	// サブコマンドを取得
	const subcommand = interaction.options.getSubcommand()
	if (subcommand === 'rename') {
		await renameFreeChannel(interaction)
	} else if (subcommand === 'limit') {
		await setLimit(interaction)
	}
}

// フリーチャンネルの名前を変更する関数
const renameFreeChannel = async (interaction: ChatInputCommandInteraction) => {
	const name = interaction.options.getString('name') ?? ''
	const member = interaction.member as GuildMember
	const voiceChannel = member.voice.channel
	if (!voiceChannel) {
		return await sendErrorReply(
			interaction,
			'フリーボイスチャンネルに参加してからコマンドを実行してください。'
		)
	}
	if (voiceChannel.id === DISCORD_FREE_VOICE_CHANNEL_ID) {
		return await sendErrorReply(
			interaction,
			'フリーボイスチャンネル作成チャンネルでは実行できません。'
		)
	}
	const category = voiceChannel.parent
	// フリーチャンネルでない場合はエラーを返す
	if (!category || category.id !== DISCORD_FREE_VOICE_CATEGORY_ID) {
		return await sendErrorReply(interaction, 'フリーボイスチャンネルでのみ実行できます。')
	}
	// チャンネル名を変更
	await voiceChannel.setName(`🔊${name}`)
	// 返信
	const embed = new EmbedBuilder()
		.setTitle('🗽フリーボイスチャンネルの名前変更')
		.setDescription(`フリーボイスチャンネルの名前を変更しました: ${name}`)
		.setColor(0x00ae86) // 緑色
	await interaction.reply({
		embeds: [embed],
		ephemeral: true,
	})
}

const setLimit = async (interaction: ChatInputCommandInteraction) => {
	const limit = interaction.options.getInteger('limit') ?? 0
	const member = interaction.member as GuildMember
	const voiceChannel = member.voice.channel
	if (!voiceChannel) {
		return await sendErrorReply(
			interaction,
			'フリーボイスチャンネルに参加してからコマンドを実行してください。'
		)
	}
	if (voiceChannel.id === DISCORD_FREE_VOICE_CHANNEL_ID) {
		return await sendErrorReply(
			interaction,
			'フリーボイスチャンネル作成チャンネルでは実行できません。'
		)
	}
	const category = voiceChannel.parent
	// フリーチャンネルでない場合はエラーを返す
	if (!category || category.id !== DISCORD_FREE_VOICE_CATEGORY_ID) {
		return await sendErrorReply(interaction, 'フリーボイスチャンネルでのみ実行できます。')
	}
	// 人数制限を設定
	await voiceChannel.setUserLimit(limit)
	// 返信
	const embed = new EmbedBuilder()
		.setTitle('🗽フリーボイスチャンネルの人数制限設定')
		.setDescription(`フリーボイスチャンネルの人数制限を設定しました: ${limit}`)
		.setColor(0x00ae86) // 緑色
	await interaction.reply({
		embeds: [embed],
		ephemeral: true,
	})
}
