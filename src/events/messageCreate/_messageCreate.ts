import { Events, type Message } from 'discord.js'

export const name = Events.MessageCreate

export const execute = async (message: Message) => {
	if (message.author.bot) {
		return
	}

	if (message.content === 'ping') {
		await message.reply('pong')
	}
}
