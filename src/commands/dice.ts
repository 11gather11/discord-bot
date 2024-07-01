import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
  .setName('ダイス')
  .setDescription('Rolls a dice and returns the result')
  .addStringOption((option) =>
    option
      .setName('式')
      .setDescription('Number of sides on the dice')
      .setRequired(true)
  )

// コマンドが実行されたときの処理
export async function execute(interaction: CommandInteraction): Promise<void> {
  // 引数からサイコロの面数を取得
  const sides = interaction.options.data[0].value as number
  // サイコロを振る処理
  const roll = Math.floor(Math.random() * sides) + 1
  // 結果を返信
  await interaction.reply(`You rolled a ${roll} on a ${sides}-sided dice`)
}
