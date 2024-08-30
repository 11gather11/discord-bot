import {
	minecraftFormButtonHandler,
	minecraftFormSubmitHandler,
} from '@/commands/minecraftForm/minecraftForm'
import { Events, type Interaction } from 'discord.js'

// イベント名
export const name = Events.InteractionCreate

// イベントが発生した際に実行される関数
export const execute = async (interaction: Interaction) => {
	// ボタンやモーダルのイベント以外は無視
	if (!(interaction.isButton() || interaction.isModalSubmit())) {
		return
	}
	// カスタムIDがminecraftFormでない場合は無視
	if (interaction.customId !== 'minecraftForm') {
		return
	}
	// ボタンの場合
	if (interaction.isButton()) {
		await minecraftFormButtonHandler(interaction)
	}
	// モーダルの場合
	if (interaction.isModalSubmit()) {
		await minecraftFormSubmitHandler(interaction)
	}
}
