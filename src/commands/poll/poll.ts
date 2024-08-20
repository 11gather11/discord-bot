import { SlashCommandBuilder } from '@discordjs/builders'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
} from 'discord.js'

// コマンドのデータ
export const data = new SlashCommandBuilder()
	.setName('poll')
	.setDescription('投票を作成します')
	.addStringOption((option) =>
		option.setName('question').setDescription('投票の質問を入力してください').setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName('options')
			.setDescription('カンマで区切られた選択肢を入力してください (例: option1,option2)')
			.setRequired(true)
	)
	.addIntegerOption((option) =>
		option
			.setName('time')
			.setDescription('投票の時間を秒単位で入力してください (デフォルト: 60秒)')
			.setRequired(false)
	)

// 開発環境の場合、デフォルトの権限を設定
if (process.env.NODE_ENV === 'development') {
	data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
}

export const execute = async (interaction: ChatInputCommandInteraction) => {
	// 質問と選択肢を取得
	const question = interaction.options.getString('question')
	const options = interaction.options.getString('options')?.split(',') ?? []
	const totalTime = interaction.options.getInteger('time') ?? 60

	if (options.length < 2 || options.length > 10) {
		const errorEmbed = new EmbedBuilder()
			.setTitle('⛔️エラー')
			.setDescription('選択肢は2つ以上10以下で指定してください。')
			.setColor(0xff0000) // 赤色

		return interaction.reply({
			embeds: [errorEmbed],
			ephemeral: true,
		})
	}

	// 投票時間を設定
	let timeRemaining = totalTime

	// 埋め込みメッセージを作成
	const embed = new EmbedBuilder()
		.setTitle('📊投票')
		.setDescription(question)
		.setColor(0x00ae86)
		.setFooter({ text: `残り時間: ${timeRemaining}秒` })

	const actionRow = new ActionRowBuilder<ButtonBuilder>()

	options.forEach((option, index) => {
		embed.addFields({ name: `${index + 1}`, value: `${option}`, inline: true })
		actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`vote_${index}`)
				.setLabel(`${index + 1}`)
				.setStyle(ButtonStyle.Primary)
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
		embed.setFooter({ text: `残り時間: ${timeRemaining}秒` })
		await interaction.editReply({ embeds: [embed], components: [actionRow] })

		if (timeRemaining <= 0) {
			clearInterval(countdown)
		}
	}, 1000)

	const collector = pollMessage.createMessageComponentCollector({ time: totalTime * 1000 })

	const votes = new Array(options.length).fill(0)
	const userVotes = new Map<string, number>() // ユーザーIDと選択したオプションのインデックスを追跡

	collector.on('collect', (i) => {
		const previousVoteIndex = userVotes.get(i.user.id)
		const newVoteIndex = Number.parseInt(i.customId.split('_')[1])

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
			.setTitle('📊投票結果')
			.setDescription(question)
			.setColor(0x00ae86)

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
}
