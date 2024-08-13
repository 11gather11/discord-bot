import {
	type ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js'

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('ボットの応答速度を測定します')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	await interaction.reply('Pong!')
	await interaction.editReply({
		content: `Pong! APIレイテンシ : ${Math.round(interaction.client.ws.ping)}ms 🛰️`,
	})
}
