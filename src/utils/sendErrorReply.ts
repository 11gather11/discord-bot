import { EmbedBuilder, type Interaction } from 'discord.js'

// エラーメッセージを送信する関数
export const sendErrorReply = async (interaction: Interaction, message: string) => {
	const errorEmbed = new EmbedBuilder()
		.setTitle('⛔️エラー')
		.setDescription(message)
		.setColor(0xff0000)

	if (!interaction.isCommand()) {
		return
	}

	await interaction.reply({
		embeds: [errorEmbed],
		ephemeral: true,
	})
}
