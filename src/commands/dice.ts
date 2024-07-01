import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
  .setName('dice')
  .setDescription('Rolls a dice and returns the result')

// コマンドが実行されたときの処理
export async function execute(interaction: CommandInteraction): Promise<void> {
  const roll = Math.floor(Math.random() * 6) + 1
  await interaction.reply(`You rolled a ${roll}`)
}
