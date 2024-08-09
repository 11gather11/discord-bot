import { type CommandInteraction, SlashCommandBuilder } from 'discord.js'

import { rollDice } from '../../utils/rollDice'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('dice_normal')
	.setDescription('ダイスを振って結果を返します。')
	.addStringOption((option) =>
		option
			.setName('式')
			.setDescription(
				'入力例: 1d100 ← 100面のダイスを1回振る場合 1d10+1d6 ← 10面のダイスを1回振った結果と6面のダイスを1回振った結果を足す場合'
			)
			.setRequired(true)
	)

// コマンドが実行されたときの処理
export const execute = async (interaction: CommandInteraction): Promise<void> => {
	const expression = interaction.options.data[0].value as string

	const result = rollDice(expression)

	if (!result.success) {
		await interaction.reply({
			content: result.message,
			ephemeral: true,
		})
		return
	}

	await interaction.reply({
		content: `<@${interaction.user.id}> ${result.message}`,
	})
}
