import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
  .setName('ダイス_通常')
  .setDescription('Rolls a dice and returns the result')
  .addStringOption((option) =>
    option
      .setName('式')
      .setDescription('Number of sides on the dice')
      .setRequired(true)
  )

// コマンドが実行されたときの処理
export async function execute(interaction: CommandInteraction): Promise<void> {
  // 引数からダイスの式を取得
  const expression = interaction.options.data[0].value as string
  // 正規表現でダイスの個数と面数を抽出
  const match = expression.match(/^(\d+)d(\d+)$/)
  // マッチしなかった場合はエラーメッセージを返す
  if (!match) {
    await interaction.reply({
      content: 'Invalid format. Please use NdM format (e.g., 2d6).',
      ephemeral: true,
    })
    return
  }
  // ダイスの個数と面数を取得
  const numDice = parseInt(match[1], 10)
  const sides = parseInt(match[2], 10)
  // ダイスを振る処理
  const rolls = []
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }
  // 結果を返す
  const total = rolls.reduce((acc, cur) => acc + cur, 0)

  // 返信メッセージを送信
  await interaction.reply({
    content: `<@${interaction.user.id}> ${expression} → (${rolls.join(' + ')}) = ${total}`,
  })
}
