import { SlashCommandBuilder } from '@discordjs/builders'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	EmbedBuilder,
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

export const execute = async (interaction: ChatInputCommandInteraction) => {
	// 質問と選択肢を取得

	const question = interaction.options.getString('question')
	const options = interaction.options.getString('options')?.split(',') ?? []

	if (options.length < 2 || options.length > 10) {
		return interaction.reply({
			content: '選択肢は2つ以上10以下で指定してください。',
			ephemeral: true,
		})
	}

	// 投票用の埋め込みメッセージを作成
	const embed = new EmbedBuilder().setTitle('📊 投票').setDescription(question).setColor(0x00ae86)

	const actionRow = new ActionRowBuilder<ButtonBuilder>()

	options.forEach((option, index) => {
		embed.addFields({ name: '\u200B', value: `**${index + 1}:** ${option}` })
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

	const collector = pollMessage.createMessageComponentCollector({ time: 60000 })

	const votes = new Array(options.length).fill(0)

	collector.on('collect', (i) => {
		const index = Number.parseInt(i.customId.split('_')[1])
		votes[index]++
		i.reply({ content: '投票ありがとうございました!', ephemeral: true })
	})

	collector.on('end', () => {
		const results = options.map((option, index) => `${option}: ${votes[index]} 票`).join('\n')
		interaction.followUp({ content: `投票結果:\n${results}` })
	})
}
