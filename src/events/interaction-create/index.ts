import {
	type AutocompleteInteraction,
	type ButtonInteraction,
	type CacheType,
	type ChatInputCommandInteraction,
	Events,
	type ModalSubmitInteraction,
} from 'discord.js'
import { logger } from '@/lib/logger'
import type { Event } from '@/types/event'

export default {
	name: Events.InteractionCreate,
	once: false,
	execute(interaction) {
		// 受け取ったインタラクションの種類に応じてハンドラを呼び出す
		if (interaction.isChatInputCommand()) {
			handleChatInputCommand(interaction)
		} else if (interaction.isButton()) {
			handleButton(interaction)
		} else if (interaction.isAutocomplete()) {
			handleAutocomplete(interaction)
		} else if (interaction.isModalSubmit()) {
			handleModalSubmit(interaction)
		}
	},
} satisfies Event<Events.InteractionCreate>

// ChatInputCommand（スラッシュコマンド）の処理
const handleChatInputCommand = (interaction: ChatInputCommandInteraction<CacheType>) => {
	const command = interaction.client.commands.get(interaction.commandName)
	if (!command) {
		return
	}

	try {
		// コマンドの実行
		command.execute(interaction)
	} catch (error) {
		logger.error(error)
		interaction.reply({
			content: 'コマンドの実行中にエラーが発生しました。',
			ephemeral: true,
		})
	}
}

// Autocomplete（オートコンプリート）の処理
const handleAutocomplete = (interaction: AutocompleteInteraction<CacheType>) => {
	const command = interaction.client.commands.get(interaction.commandName)
	if (!command) {
		return
	}
	try {
		if (!command.autocomplete) {
			return
		}
		command.autocomplete(interaction)
	} catch (error) {
		logger.error(error)
	}
}

// ModalSubmit（モーダル送信）の処理
const handleModalSubmit = (interaction: ModalSubmitInteraction<CacheType>) => {
	const command = interaction.client.commands.get(interaction.customId)
	if (!command) {
		return
	}
	try {
		if (!command.modal) {
			return
		}
		command.modal(interaction)
	} catch (error) {
		logger.error(error)
	}
}

const handleButton = (interaction: ButtonInteraction<CacheType>) => {
	const command = interaction.client.commands.get(interaction.customId)
	if (!command) {
		return
	}
	try {
		if (!command.button) {
			return
		}
		command.button(interaction)
	} catch (error) {
		logger.error(error)
	}
}
