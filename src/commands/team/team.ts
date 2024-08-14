import { type ChatInputCommandInteraction, type GuildMember, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
	.setName('team')
	.setDescription('チーム分けを行います。')
	.addIntegerOption((option) =>
		option
			.setName('チーム数')
			.setDescription('チームの数を入力してください。')
			.setRequired(true)
			.setMinValue(2)
			.setMaxValue(10)
	)

export const execute = async (interaction: ChatInputCommandInteraction) => {
	// memberがGuildMember型であることを確認
	const member = interaction.member as GuildMember

	// メンバーが参加しているボイスチャンネルを取得
	const voiceChannel = member.voice.channel

	// ボイスチャンネルが取得できなかった場合
	if (!voiceChannel) {
		await interaction.reply({
			content: 'ボイスチャンネルに参加してからコマンドを実行してください。',
			ephemeral: true,
		})
		return
	}

	// チーム数を取得（必須オプションなのでnullチェック不要）
	const teamCount = interaction.options.getInteger('チーム数') as number

	// ボイスチャンネル内のメンバーを取得し、ボットユーザーを除外
	const members = Array.from(voiceChannel.members.filter((m) => !m.user.bot).values())

	// メンバーがチーム数より少ない場合
	if (members.length < teamCount) {
		return interaction.reply({
			content: `チーム数 (${teamCount}) よりメンバーが少ないため、チーム分けできません。`,
			ephemeral: true,
		})
	}

	// メンバーをランダムにシャッフル
	for (let i = members.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[members[i], members[j]] = [members[j], members[i]]
	}

	// チームごとにメンバーを分配
	const teams: string[][] = Array.from({ length: teamCount }, () => [])
	members.forEach((member, index) => {
		teams[index % teamCount].push(member.displayName)
	})

	// 結果をメッセージとして作成
	const teamMessage = teams
		.map((team, index) => `チーム ${index + 1}: ${team.join(', ')}`)
		.join('\n')

	// 結果を返信
	await interaction.reply({
		content: `チーム分けの結果:\n${teamMessage}`,
	})
}
