import { sendErrorReply } from '@/utils/sendErrorReply'
import { Collection, EmbedBuilder, Events, type Interaction } from 'discord.js'

// イベント名
export const name = Events.InteractionCreate

// クールダウン情報を保持するためのコレクション
const cooldowns = new Collection<string, Collection<string, number>>()

export const execute = async (interaction: Interaction) => {
	// コマンド以外のイベントは無視
	if (!interaction.isCommand()) {
		return
	}

	// コマンドが存在するか確認
	const command = interaction.client.commands.get(interaction.commandName)

	// コマンドが存在しない場合は無視
	if (!command) {
		return
	}

	// クールダウンが設定されている場合にのみ処理を行う
	if (command.cooldown) {
		// クールダウン用のコレクションを取得または初期化
		const timestamps = cooldowns.get(command.data.name) ?? new Collection<string, number>()
		// 初回の場合、コレクションをセット
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, timestamps)
		}

		// 現在の時間を取得
		const now = Date.now()
		const cooldownAmount = command.cooldown * 1000

		// ユーザーのタイムスタンプがある場合、クールダウンが終わっているか確認
		const userTimestamp = timestamps.get(interaction.user.id)
		if (userTimestamp) {
			const expirationTime = userTimestamp + cooldownAmount

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000

				const embed = new EmbedBuilder()
					.setTitle('🌀クールダウン')
					.setDescription(`あと${timeLeft.toFixed(1)}秒待ってからこのコマンドを再度使用できます。`)
					.setColor(0xffd700)

				return interaction.reply({
					embeds: [embed],
					ephemeral: true,
				})
			}
		}

		// クールダウンタイムスタンプを更新
		timestamps.set(interaction.user.id, now)
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)
	}

	try {
		await command.execute(interaction)
	} catch (error) {
		// エラーが発生した場合はエラーを出力
		console.error(error)

		await sendErrorReply(interaction, 'コマンドの実行中にエラーが発生しました。')
	}
}
