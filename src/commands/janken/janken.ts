import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type CommandInteraction,
	type Interaction,
	type MessageActionRowComponentBuilder,
	SlashCommandBuilder,
} from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
	.setName('janken')
	.setDescription('じゃんけんゲームを開始します。')

// コマンドが実行されたときの処理
export const execute = async (interaction: CommandInteraction): Promise<void> => {
	// じゃんけんのボタンを作成
	const rockButton = new ButtonBuilder()
		.setCustomId('グー')
		.setLabel('✊🏼 グー')
		.setStyle(ButtonStyle.Primary)

	const scissorsButton = new ButtonBuilder()
		.setCustomId('チョキ')
		.setLabel('✌🏼 チョキ')
		.setStyle(ButtonStyle.Danger)

	const paperButton = new ButtonBuilder()
		.setCustomId('パー')
		.setLabel('🖐🏼 パー')
		.setStyle(ButtonStyle.Success)

	// ボタンをアクションローに追加
	const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
		rockButton,
		paperButton,
		scissorsButton
	)

	// メッセージを送信
	interaction.reply({
		content: 'じゃんけん！選んでください: (残り時間: 10秒)',
		components: [actionRow],
		fetchReply: true,
	})

	// ボタンのクリックをフィルタリング
	const filter = (i: Interaction) => i.isButton()
	// 10秒間ボタンのクリックを待つ
	const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 10000 })
	// ユーザーごとの選択肢を保持するMap
	const choices = new Map<string, string>()
	// 残り時間をカウントダウンする
	let remainingTime = 10
	// カウントダウンのインターバルを設定
	const countdownInterval = setInterval(() => {
		remainingTime -= 1
		interaction.editReply(`じゃんけん！選んでください: (残り時間: ${remainingTime}秒)`)
	}, 1000)
	// ボタンがクリックされたときの処理
	collector?.on('collect', async (i) => {
		if (!i.isButton()) {
			return
		}
		choices.set(i.user.id, i.customId)
		await i.deferUpdate()
	})
	// ボタンのクリックが終了したときの処理
	collector?.on('end', async () => {
		clearInterval(countdownInterval)

		if (choices.size === 0) {
			await interaction.editReply({ content: '誰も参加しませんでした。', components: [] })
			return
		}
		// 選択肢を表示
		const results = Array.from(choices.entries()).map(([userId, choice]) => ({
			userId,
			displayName: interaction.guild?.members.cache.get(userId)?.displayName, // 表示名を使用
			choice,
		}))
		// 結果を表示
		let resultMessage = results.map((r) => `${r.displayName}: ${r.choice}`).join('\n')
		const outcomes = calculateOutcome(results)
		resultMessage += `\n\n**勝者:** ${outcomes.winners.join(', ')}\n**あいこ:** ${outcomes.draw ? 'はい' : 'いいえ'}`

		await interaction.editReply({
			content: resultMessage,
			components: [],
		})
	})
}

// じゃんけんの結果を計算する関数
const calculateOutcome = (results: { userId: string; displayName?: string; choice: string }[]) => {
	const choiceCounts = countChoices(results)

	// あいこ（引き分け）の判定
	const isDraw = determineIfDraw(choiceCounts)

	// 勝者の決定
	const winners = isDraw ? [] : determineWinners(results, choiceCounts)

	return { winners, draw: isDraw }
}

// 各選択肢の数を数える関数
const countChoices = (results: { userId: string; choice: string }[]) => {
	const counts = { グー: 0, チョキ: 0, パー: 0 }

	for (const result of results) {
		counts[result.choice as keyof typeof counts]++
	}

	return counts
}

// あいこかどうかを判定する関数
const determineIfDraw = (counts: { グー: number; パー: number; チョキ: number }) => {
	const { グー, チョキ, パー } = counts

	// 全員が同じ手を出したか、三すくみの状態なら引き分け
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
