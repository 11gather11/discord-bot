import { sendErrorReply } from '@/utils/sendErrorReply'
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { toHalfWidth } from '../../utils/toHalfWidth'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('dice')
	.setDescription('ダイスを振るコマンドです。')
	.addSubcommand((subcommand) =>
		subcommand
			.setName('normal')
			.setDescription('ダイスを振って結果を返します。')
			.addStringOption((option) =>
				option
					.setName('式')
					.setDescription(
						'入力例: 1d100 ← 100面のダイスを1回振る場合 1d10+1d6 ← 10面のダイスを1回振った結果と6面のダイスを1回振った結果を足す場合'
					)
					.setRequired(true)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName('secret')
			.setDescription('ダイスを振って結果を返します。(他のユーザーには見えません)')
			.addStringOption((option) =>
				option
					.setName('式')
					.setDescription(
						'入力例: 1d100 ← 100面のダイスを1回振る場合 1d10+1d6 ← 10面のダイスを1回振った結果と6面のダイスを1回振った結果を足す場合'
					)
					.setRequired(true)
			)
	)

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	const subcommand = interaction.options.getSubcommand()
	const expression = interaction.options.getString('式') ?? ''
	const result = rollDice(expression)

	const isSecret = subcommand === 'secret'

	if (!result.success) {
		return await sendErrorReply(interaction, result.message)
	}

	// ダイス結果を埋め込みメッセージとして表示
	const resultEmbed = new EmbedBuilder()
		.setTitle('🎲ダイスロール結果')
		.setDescription(result.message)
		.setColor(0x00ae86) // 緑色

	await interaction.reply({
		embeds: [resultEmbed],
		ephemeral: isSecret, // secret の場合は他のユーザーには見えない
	})
}

export const rollDice = (expression: string): { success: boolean; message: string } => {
	// 正規表現で複数のダイス式を抽出
	const convertExpression = toHalfWidth(expression)
	const dicePatterns = convertExpression.split('+')
	const rolls: number[] = []
	const results: string[] = []

	for (const pattern of dicePatterns) {
		const match = pattern.trim().match(/^(\d+)d(\d+)$/)
		if (!match) {
			return {
				success: false,
				message: '無効なフォーマットです。NdM形式を使用してください（例:2d6）。',
			}
		}
		const numDice = Number.parseInt(match[1], 10)
		const sides = Number.parseInt(match[2], 10)
		const patternRolls: number[] = []
		for (let i = 0; i < numDice; i++) {
			patternRolls.push(Math.floor(Math.random() * sides) + 1)
		}
		rolls.push(...patternRolls)
		results.push(`(${patternRolls.join(' + ')})`)
	}

	const total = rolls.reduce((acc, cur) => acc + cur, 0)

	let message: string
	if (dicePatterns.length > 1) {
		message = `${convertExpression} → ${results.join(' + ')} = ${total}`
	} else {
		message = `${convertExpression} → ${results[0]} = ${total}`
	}

	return { success: true, message }
}
