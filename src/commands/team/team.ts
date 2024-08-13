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
	// ボイスチャンネルを取得
	const voiceChannel = member.voice.channel

	if (!voiceChannel) {
		// ボイスチャンネルが取得できなかった場合
		await interaction.reply({
			content: 'ボイスチャンネルに参加してからコマンドを実行してください。',
			ephemeral: true,
		})
		return
	}

	await interaction.reply('チーム分けを行います。')
}
