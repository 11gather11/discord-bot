import { type CommandInteraction, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('ボットの応答速度を測定します')

export const execute = async (interaction: CommandInteraction): Promise<void> => {
	await interaction.reply('Pong!')
}
