import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	EmbedBuilder,
	ModalBuilder,
	type ModalSubmitInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js'

const { DISCORD_MINECRAFT_CHANNEL_ID } = process.env

if (!DISCORD_MINECRAFT_CHANNEL_ID) {
	throw new Error('環境変数が設定されていません')
}

// コマンドのデータ
export const data = new SlashCommandBuilder()
	.setName('minecraft_form')
	.setDescription('Minecraftの参加フォームを作成します')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 管理者のみ実行可能

export const execute = async (interaction: ChatInputCommandInteraction) => {
	// 「参加はこちら」ボタンを作成
	const button = new ButtonBuilder()
		.setCustomId('minecraftForm')
		.setLabel('参加はこちら')
		.setStyle(ButtonStyle.Success)

	// ボタンを含むアクションロウを作成
	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

	const embed = new EmbedBuilder()
		.setTitle('🕋Minecraftサーバー参加フォーム')
		.setDescription('Minecraftサーバーに参加するには、以下のボタンをクリックしてください。')
		.setColor(0x00ae86)

	// ボタンを含むメッセージを送信
	await interaction.reply({
		embeds: [embed],
		components: [actionRow],
	})
}

// ボタンがクリックされたときの処理
export const minecraftFormButtonHandler = async (interaction: ButtonInteraction) => {
	if (interaction.customId === 'minecraftForm') {
		// フォームの作成
		const form = new ModalBuilder()
			.setCustomId('minecraftForm')
			.setTitle('🕋マインクラフト参加フォーム')

		// ユーザー名の入力フィールドを作成
		const usernameInput = new TextInputBuilder()
			.setCustomId('minecraftUsername')
			.setLabel('Minecraftのユーザー名を入力してください')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)

		// フォームに入力フィールドを追加
		const usernameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput)

		// フォームに行を追加
		form.addComponents(usernameRow)

		// フォームを表示
		await interaction.showModal(form)
	}
}

// フォーム送信時の処理
export const minecraftFormSubmitHandler = async (interaction: ModalSubmitInteraction) => {
	if (interaction.customId === 'minecraftForm') {
		// フォームから送信されたデータを取得
		const minecraftUsername = interaction.fields.getTextInputValue('minecraftUsername')

		// フォームの送信者を取得
		const guild = interaction.guild
		if (!guild) {
			console.error('サーバーが見つかりませんでした。')
			return
		}
		// フォームの送信者が入力したデータをチャンネルに送信
		const channel = await guild.channels.fetch(DISCORD_MINECRAFT_CHANNEL_ID)
		if (!channel?.isTextBased()) {
			console.error('チャンネルが見つかりませんでした。')
			return
		}

		const embed = new EmbedBuilder()
			.setTitle(
				`送信者ID:**${interaction.user.username}** 表示名:**${interaction.user.displayName}**`
			)
			.setDescription(`Minecraftのユーザー名: **${minecraftUsername}**`)
			.setColor(0x00ae86)

		// チャンネルに埋め込みメッセージとして送信
		await channel.send({ embeds: [embed] })

		const replyEmbed = new EmbedBuilder()
			.setTitle('🕋マインクラフト参加フォーム')
			.setDescription('フォームの送信が完了しました。')
			.setColor(0x00ae86)

		await interaction.reply({
			embeds: [replyEmbed],
			ephemeral: true, // メッセージを送信者にのみ表示
		})
	}
}
