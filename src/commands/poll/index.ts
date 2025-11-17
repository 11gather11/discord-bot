import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { config } from '@/config/config'
import type { Command } from '@/types/command'
import { sendErrorReply } from '@/utils/sendErrorReply'

const command: Command = {
	// コマンドのデータ
	command: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('投票を作成します')
		.addStringOption((option) =>
			option.setName('質問').setDescription('投票の質問を入力してください').setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('選択肢')
				.setDescription('カンマで区切られた選択肢を入力してください (例: 選択肢1,選択肢2)')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('時間')
				.setDescription('投票の時間を秒単位で入力してください (デフォルト: 60秒)')
				.setRequired(false)
				.setMinValue(10)
				.setMaxValue(86400),
		),

	execute: async (interaction) => {
		// 質問と選択肢を取得
		const question = interaction.options.getString('質問')
		const options = interaction.options.getString('選択肢')?.split(',') ?? []
		const totalTime = interaction.options.getInteger('時間') ?? 60

		if (options.length < 2 || options.length > 10) {
			return await sendErrorReply(interaction, '選択肢は2つ以上10以下で指定してください。')
		}

		// 投票時間を設定
		let timeRemaining = totalTime

		// 時間を日、時、分、秒に変換する関数
		const formatTime = (totalSeconds: number) => {
			const days = Math.floor(totalSeconds / (24 * 60 * 60))
			const remainingAfterDays = totalSeconds % (24 * 60 * 60)
			const hours = Math.floor(remainingAfterDays / (60 * 60))
			const remainingAfterHours = remainingAfterDays % (60 * 60)
			const minutes = Math.floor(remainingAfterHours / 60)
			const seconds = remainingAfterHours % 60

			return `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`
		}

		// 埋め込みメッセージを作成
		const embed = new EmbedBuilder()
			.setTitle(`${config.icons.poll} 投票`)
			.setDescription(question)
			.setColor(config.colors.success)
			.setFooter({ text: `残り時間: ${formatTime(timeRemaining)}` })

		const actionRow = new ActionRowBuilder<ButtonBuilder>()

		options.forEach((option, index) => {
			embed.addFields({ name: `${index + 1}`, value: `${option}`, inline: true })
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`vote_${index}`)
					.setLabel(`${index + 1}`)
					.setStyle(ButtonStyle.Primary),
			)
		})

		// 投票メッセージを送信
		const pollMessage = await interaction.reply({
			embeds: [embed],
			components: [actionRow],
			fetchReply: true,
		})

		const countdown = setInterval(async () => {
			timeRemaining -= 1
			embed.setFooter({ text: `残り時間: ${formatTime(timeRemaining)}` })

			const shouldUpdate = shouldUpdateEmbed(timeRemaining)
			if (shouldUpdate) {
				await interaction.editReply({ embeds: [embed], components: [actionRow] })
			}

			if (timeRemaining <= 0) {
				clearInterval(countdown)
			}
		}, 1000)

		// 更新が必要かどうかを判定する関数
		const shouldUpdateEmbed = (timeRemaining: number): boolean => {
			const updateIntervals = [
				{ threshold: 86400, interval: 43200 }, // 1日以上: 12時間ごとに更新
				{ threshold: 43200, interval: 21600 }, // 12時間以上: 6時間ごとに更新
				{ threshold: 21600, interval: 3600 }, // 6時間以上: 1時間ごとに更新
				{ threshold: 3600, interval: 1800 }, // 60分以上: 30分ごとに更新
				{ threshold: 1800, interval: 600 }, // 30分以上: 10分ごとに更新
				{ threshold: 600, interval: 300 }, // 10分以上: 5分ごとに更新
				{ threshold: 300, interval: 60 }, // 5分以上: 1分ごとに更新
				{ threshold: 60, interval: 30 }, // 60秒以上: 30秒ごとに更新
				{ threshold: 30, interval: 10 }, // 30秒以上: 10秒ごとに更新
				{ threshold: 10, interval: 5 }, // 10秒以上: 5秒ごとに更新
			]

			// 各閾値に対する更新間隔をチェック
			for (const { threshold, interval } of updateIntervals) {
				if (timeRemaining > threshold) {
					return timeRemaining % interval === 0
				}
			}

			// 10秒以下の場合は毎秒更新
			return timeRemaining <= 10
		}

		const collector = pollMessage.createMessageComponentCollector({ time: totalTime * 1000 })

		const votes = new Array(options.length).fill(0)
		const userVotes = new Map<string, number>() // ユーザーIDと選択したオプションのインデックスを追跡

		collector.on('collect', (i) => {
			const previousVoteIndex = userVotes.get(i.user.id)
			const newVoteIndex = Number.parseInt(i.customId.split('_')[1] ?? '0', 10)

			// 以前の投票をキャンセル
			if (previousVoteIndex !== undefined) {
				votes[previousVoteIndex]--
			}

			// 新しい投票を追加
			votes[newVoteIndex]++
			userVotes.set(i.user.id, newVoteIndex)

			i.reply({ content: '投票が更新されました!', ephemeral: true })
		})

		collector.on('end', async () => {
			clearInterval(countdown)
			const totalVotes = votes.reduce((acc, curr) => acc + curr, 0)

			const resultsEmbed = new EmbedBuilder()
				.setTitle(`${config.icons.poll} 投票結果`)
				.setDescription(question)
				.setColor(config.colors.success)

			options.forEach((option, index) => {
				const voteCount = votes[index]
				const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : '0.00'
				resultsEmbed.addFields({
					name: option,
					value: `${voteCount} 票 (${percentage}%)`,
					inline: true,
				})
			})

			// 元の投票メッセージを投票結果に置き換える
			await interaction.editReply({
				embeds: [resultsEmbed],
				components: [],
			})
		})
	},
}

export default command
