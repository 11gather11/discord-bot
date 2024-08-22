import { type ButtonInteraction, type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

// エラーメッセージを送信する関数
export const sendErrorReply = async (
	interaction: ChatInputCommandInteraction | ButtonInteraction,
	message: string
) => {
	const errorEmbed = new EmbedBuilder()
		.setTitle('⛔️エラー')
		.setDescription(message)
		.setColor(0xff0000)

	await interaction.reply({
		embeds: [errorEmbed],
		ephemeral: true,
	})
}
