import { config } from '@/config/config'
import { logger } from '@/helpers/logger'
import type { Command } from '@/types/client'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js'

const { DISCORD_MINECRAFT_CHANNEL_ID } = process.env

if (!DISCORD_MINECRAFT_CHANNEL_ID) {
	throw new Error('環境変数が設定されていません')
}

const command: Command = {
	// コマンドのデータ
	command: new SlashCommandBuilder()
		.setName('マインクラフト参加フォーム')
		.setDescription('Minecraftの参加フォームを作成します')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 管理者のみ実行可能

	execute: async (interaction) => {
		// 「参加はこちら」ボタンを作成
		const button = new ButtonBuilder()
			.setCustomId('マインクラフト参加フォーム')
			.setLabel('参加はこちら')
			.setStyle(ButtonStyle.Success)

		// ボタンを含むアクションロウを作成
		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

		const embed = new EmbedBuilder()
			.setTitle('🕋 Minecraftサーバー参加フォーム')
			.setDescription('Minecraftサーバーに参加するには、以下のボタンをクリックしてください。')
			.setColor(config.colors.success)

		// ボタンを含むメッセージを送信
		await interaction.reply({
			embeds: [embed],
			components: [actionRow],
		})
	},
	button: async (interaction) => {
		// フォームの作成
		const form = new ModalBuilder()
			.setCustomId('マインクラフト参加フォーム')
			.setTitle('🕋 マインクラフト参加フォーム')

		// ユーザー名の入力フィールドを作成
		const usernameInput = new TextInputBuilder()
			.setCustomId('minecraftUsername')
			.setLabel('Minecraftのユーザー名を入力してください')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)

		//意気込みの入力フィールドを作成
		const otherInput = new TextInputBuilder()
			.setCustomId('other')
			.setLabel('意気込みなどがあれば入力してください')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)

		// フォームに入力フィールドを追加
		const usernameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput)
		const otherRow = new ActionRowBuilder<TextInputBuilder>().addComponents(otherInput)

		// フォームに行を追加
		form.addComponents(usernameRow, otherRow)

		// フォームを表示
		await interaction.showModal(form)
	},
	modal: async (interaction) => {
		// フォームから送信されたデータを取得
		const minecraftUsername = interaction.fields.getTextInputValue('minecraftUsername')
		const other = interaction.fields.getTextInputValue('other')

		// フォームの送信者を取得
		const guild = interaction.guild
		if (!guild) {
			logger.error('サーバーが見つかりませんでした。')
			return
		}
		// フォームの送信者が入力したデータをチャンネルに送信
		const channel = await guild.channels.fetch(DISCORD_MINECRAFT_CHANNEL_ID)
		if (!channel?.isTextBased()) {
			logger.error('チャンネルが見つかりませんでした。')
			return
		}

		const embed = new EmbedBuilder()
			.setTitle(
				`送信者ID:**${interaction.user.username}** 表示名:**${interaction.user.displayName}**`
			)
			.setDescription(`Minecraftのユーザー名: **${minecraftUsername}** \n 意気込み: ${other}`)
			.setColor(config.colors.success)

		// チャンネルに埋め込みメッセージとして送信
		await channel.send({ embeds: [embed] })

		const replyEmbed = new EmbedBuilder()
			.setTitle('🕋 マインクラフト参加フォーム')
			.setDescription('フォームの送信が完了しました。')
			.setColor(config.colors.success)

		await interaction.reply({
			embeds: [replyEmbed],
			ephemeral: true, // メッセージを送信者にのみ表示
		})
	},
}

export default command
