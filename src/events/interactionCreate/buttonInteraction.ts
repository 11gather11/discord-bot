import { MinecraftFormButtonHandler } from '@/commands/minecraftForm/minecraftForm'
import { Events, type Interaction } from 'discord.js'

// イベント名
export const name = Events.InteractionCreate

export const execute = async (interaction: Interaction) => {
	// ボタン以外のイベントは無視
	if (!interaction.isButton()) {
		return
	}
	if (interaction.customId === 'minecraftForm') {
		await MinecraftFormButtonHandler(interaction)
	}
}
