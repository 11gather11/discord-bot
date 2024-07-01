// src/commands/ping.ts

import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'

// コマンドの設定をエクスポート
export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')

// コマンドが実行されたときの処理
export async function execute(interaction: CommandInteraction): Promise<void> {
  await interaction.reply('Pong!')
}
