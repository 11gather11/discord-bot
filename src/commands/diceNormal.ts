import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'

import { rollDice } from '../lib/rollDice'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
  .setName('ダイス_通常')
  .setDescription('ダイスを振って結果を返します。')
  .addStringOption((option) =>
    option
      .setName('式')
      .setDescription('入力例: 1d100← 100面のダイスを1回振る場合')
      .setRequired(true)
  )

// コマンドが実行されたときの処理
export async function execute(interaction: CommandInteraction): Promise<void> {
  const expression = interaction.options.data[0].value as string

  const result = rollDice(expression)

  if (!result.success) {
    await interaction.reply({
      content: result.message,
      ephemeral: true,
    })
    return
  }

  await interaction.reply({
    content: `<@${interaction.user.id}> ${result.message}`,
  })
}
