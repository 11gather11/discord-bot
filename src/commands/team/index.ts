import { EmbedBuilder, type GuildMember, SlashCommandBuilder } from 'discord.js'
import { config } from '@/config/config'
import type { Command } from '@/types/command'
import { sendErrorReply } from '@/utils/sendErrorReply'

const command: Command = {
	command: new SlashCommandBuilder()
		.setName('チーム分け')
		.setDescription('チーム分けを行います。')
		.addIntegerOption((option) =>
			option
				.setName('チーム数')
				.setDescription('チームの数を入力してください。')
				.setRequired(true)
				.setMinValue(2)
				.setMaxValue(10),
		),

	execute: async (interaction) => {
		// memberがGuildMember型であることを確認
		const member = interaction.member as GuildMember

		// メンバーが参加しているボイスチャンネルを取得
		const voiceChannel = member.voice.channel

		// ボイスチャンネルが取得できなかった場合
		if (!voiceChannel) {
			return await sendErrorReply(interaction, 'ボイスチャンネルに参加してからコマンドを実行してください。')
		}

		// チーム数を取得（必須オプションなのでnullチェック不要）
		const teamCount = interaction.options.getInteger('チーム数') as number

		// ボイスチャンネル内のメンバーを取得し、ボットユーザーを除外
		const members = Array.from(voiceChannel.members.filter((m) => !m.user.bot).values())

		// メンバーがチーム数より少ない場合
		if (members.length < teamCount) {
			return await sendErrorReply(
				interaction,
				`チーム数 (${teamCount}) よりメンバーが少ないため、チーム分けできません。`,
			)
		}

		// メンバーをランダムにシャッフル
		for (let i = members.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			const memberJ = members[j]
			const memberI = members[i]
			if (memberJ && memberI) {
				;[members[i], members[j]] = [memberJ, memberI]
			}
		}

		// チームごとにメンバーを分配
		const teams: string[][] = Array.from({ length: teamCount }, () => [])
		members.forEach((member, index) => {
			const team = teams[index % teamCount]
			if (team) {
				team.push(member.displayName)
			}
		})

		// 埋め込みメッセージの作成
		const embed = new EmbedBuilder()
			.setTitle(`${config.icons.team} チーム分けの結果`)
			.setColor(config.colors.success) // 緑色
			.setDescription('以下のチームに分けられました:')

		teams.forEach((team, index) => {
			embed.addFields({ name: `チーム ${index + 1}`, value: team.join('\n'), inline: false })
		})

		// 結果を返信
		await interaction.reply({
			embeds: [embed],
		})
	},
}

export default command
