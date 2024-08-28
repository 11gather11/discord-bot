import { MinecraftFormSubmitHandler } from '@/commands/minecraftForm/minecraftForm'
import { Events, type Interaction } from 'discord.js'

// イベント名
export const name = Events.InteractionCreate

export const execute = async (interaction: Interaction) => {
	// モーダル以外のイベントは無視
	if (!interaction.isModalSubmit()) {
		return
	}
	if (interaction.customId === 'minecraftForm') {
		await MinecraftFormSubmitHandler(interaction)
	}
}
