import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	EmbedBuilder,
	type Interaction,
	type MessageActionRowComponentBuilder,
	SlashCommandBuilder,
} from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('janken')
	.setDescription('じゃんけんゲームを開始します。')
	.addIntegerOption((option) =>
		// 何秒間じゃんけんを行うかを指定するオプション
		option
			.setName('秒数')
			.setDescription('じゃんけんを行う時間を秒単位で指定します。(デフォルト: 10秒)')
			.setMinValue(5)
			.setMaxValue(60)
	)

// じゃんけんボタンの作成
const createJankenButtons = () => {
	return [
		new ButtonBuilder().setCustomId('グー').setLabel('✊🏼 グー').setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId('チョキ').setLabel('✌🏼 チョキ').setStyle(ButtonStyle.Success),
		new ButtonBuilder().setCustomId('パー').setLabel('🖐🏼 パー').setStyle(ButtonStyle.Danger),
	]
}

// じゃんけんの結果を計算する関数
const calculateOutcome = (results: { userId: string; displayName?: string; choice: string }[]) => {
	const choiceCounts = countChoices(results)
	const isDraw = determineIfDraw(choiceCounts)
	const winners = isDraw ? [] : determineWinners(results, choiceCounts)
	return { winners, draw: isDraw }
}

// 各選択肢の数を数える関数
const countChoices = (results: { userId: string; choice: string }[]) => {
	return results.reduce(
		(counts, result) => {
			counts[result.choice as keyof typeof counts]++
			return counts
		},
		{ グー: 0, チョキ: 0, パー: 0 }
	)
}

// あいこかどうかを判定する関数
const determineIfDraw = (counts: { グー: number; パー: number; チョキ: number }) => {
	const { グー, チョキ, パー } = counts
	return (
		(グー > 0 && パー === 0 && チョキ === 0) ||
		(パー > 0 && グー === 0 && チョキ === 0) ||
		(チョキ > 0 && グー === 0 && パー === 0) ||
		(グー > 0 && パー > 0 && チョキ > 0)
	)
}

// 勝者を決定する関数
const determineWinners = (
	results: { userId: string; displayName?: string; choice: string }[],
	counts: { グー: number; パー: number; チョキ: number }
) => {
	const { グー, パー, チョキ } = counts
	let winningChoice = ''

	if (グー > 0 && パー > 0 && チョキ === 0) {
		winningChoice = 'パー'
	} else if (グー > 0 && チョキ > 0 && パー === 0) {
		winningChoice = 'グー'
	} else if (パー > 0 && チョキ > 0 && グー === 0) {
		winningChoice = 'チョキ'
	}

	return results
		.filter((result) => result.choice === winningChoice && result.displayName)
		.map((result) => result.displayName as string)
}

// コマンドが実行されたときの処理
export const execute = async (interaction: ChatInputCommandInteraction) => {
	const time = interaction.options.getInteger('秒数') ?? 10
	const timeInMs = time * 1000

	const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
		...createJankenButtons()
	)

	const embed = new EmbedBuilder()
		.setTitle('🫰🏻じゃんけん！')
		.setDescription(`選んでください: (残り時間: ${time}秒)`)
		.setColor(0x00ae86)

	await interaction.reply({
		embeds: [embed],
		components: [actionRow],
		fetchReply: true,
	})

	const filter = (i: Interaction) => i.isButton()
	const collector = interaction.channel?.createMessageComponentCollector({ filter, time: timeInMs })
	const choices = new Map<string, string>()
	let remainingTime = time
	const countdownInterval = setInterval(() => {
		remainingTime -= 1
		embed.setDescription(`選んでください: (残り時間: ${remainingTime}秒)`)
		interaction.editReply({ embeds: [embed], components: [actionRow] })
	}, 1000)

	collector?.on('collect', async (i) => {
		if (!i.isButton()) {
			return
		}
		choices.set(i.user.id, i.customId)
		await i.deferUpdate()
	})

	collector?.on('end', async () => {
		clearInterval(countdownInterval)

		if (choices.size === 0) {
			embed.setDescription('誰も参加しませんでした。')
			embed.setFooter({ text: 'じゃんけんを開始するにはもう一度コマンドを実行してください。' })
			await interaction.editReply({ embeds: [embed], components: [] })
			return
		}

		const results = Array.from(choices.entries()).map(([userId, choice]) => ({
			userId,
			displayName: interaction.guild?.members.cache.get(userId)?.displayName,
			choice,
			emoji: { グー: '✊🏼', チョキ: '✌🏼', パー: '🖐🏼' }[choice],
		}))

		const outcomes = calculateOutcome(results)
		let resultMessage = results.map((r) => `${r.displayName}: ${r.emoji}`).join('\n')

		resultMessage += outcomes.draw
			? '\n\n引き分けです!'
			: `\n\n**勝者:** ${outcomes.winners.join(', ')}`

		embed.setDescription(resultMessage)
		await interaction.editReply({
			embeds: [embed],
			components: [],
		})
	})
}
