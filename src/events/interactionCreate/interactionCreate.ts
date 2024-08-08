import { Events, type Interaction } from 'discord.js'

export const name = Events.InteractionCreate

export const execute = async (interaction: Interaction) => {
	// コマンド以外のイベントは無視
	if (!interaction.isCommand()) {
		return
	}
	// コマンドが存在するか確認
	const command = interaction.client.commands.get(interaction.commandName)
	// コマンドが存在しない場合は無視
	if (!command) {
		return
	}

	try {
		// コマンドを実行
		await command.execute(interaction)
	} catch (error) {
		// エラーが発生した場合はエラーを出力
		console.error(error)
		await interaction.reply({
			content: 'コマンドの実行中にエラーが発生しました',
			ephemeral: true,
		})
	}
}
