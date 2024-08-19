import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	type GuildMember,
	SlashCommandBuilder,
} from 'discord.js'

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

	// エラー用の埋め込みメッセージ
	const errorEmbed = new EmbedBuilder().setTitle('エラー').setColor(0xff0000) // 赤色

	// ボイスチャンネルが取得できなかった場合
	if (!voiceChannel) {
		// 埋め込みメッセージを設定して返信
		errorEmbed.setDescription('ボイスチャンネルに参加してからコマンドを実行してください。')

		await interaction.reply({
			embeds: [errorEmbed],
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
		// 埋め込みメッセージを設定して返信
		errorEmbed.setDescription(
			`チーム数 (${teamCount}) よりメンバーが少ないため、チーム分けできません。`
		)

		return interaction.reply({
			embeds: [errorEmbed],
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

	// 埋め込みメッセージの作成
	const embed = new EmbedBuilder()
		.setTitle('チーム分けの結果')
		.setColor(0x00ae86) // 緑色
		.setDescription('以下のチームに分けられました:')

	teams.forEach((team, index) => {
		embed.addFields({ name: `チーム ${index + 1}`, value: team.join('\n'), inline: false })
	})

	// 結果を返信
	await interaction.reply({
		embeds: [embed],
	})
}
