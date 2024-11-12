import type { Command } from '@/types/client'
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

const command: Command = {
	command: new SlashCommandBuilder().setName('ping').setDescription("Shows the bot's ping"),
	execute: (interaction) => {
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor({ name: 'MRC License' })
					.setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`),
			],
		})
	},
	cooldown: 10,
}

export default command
