import * as path from 'path'
import {
  Client,
  Events,
  GatewayIntentBits,
  type CommandInteraction,
  type Interaction,
} from 'discord.js'
import * as dotenv from 'dotenv'

import { commands, deployGlobalCommands } from './lib/deployGlobalCommands' // deployCommands関数とcommandsコレクションをインポート

// .envファイルから環境変数を読み込む
dotenv.config()

// 新しいClientインスタンスを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// ボットのトークンを環境変数から取得
const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID

if (!token || !clientId) {
  console.error('環境変数が設定されていません。')
  process.exit(1)
}

// コマンドのパスを設定
const commandsPath = path.join(__dirname, 'commands')

// ボットが起動したときに実行されるイベント
client.once(Events.ClientReady, (client): void => {
  // クライアントがログインしたときに実行される処理
  void (async (): Promise<void> => {
    try {
      console.log(`準備OK! ${client.user.tag} がログインしました。`)

      // コマンドを読み込んで登録
      await deployGlobalCommands(commandsPath, clientId, token)
    } catch (error) {
      console.error('コマンドの読み込みと登録に失敗しました:', error)
    }
  })()
})

// スラッシュコマンドが実行されたときの処理
client.on(Events.InteractionCreate, (interaction: Interaction): void => {
  ;(async (): Promise<void> => {
    if (!interaction.isCommand()) return

    const command = commands.get(interaction.commandName)
    if (!command) return

    try {
      await command.execute(interaction as CommandInteraction)
    } catch (error) {
      console.error('コマンドの実行中にエラーが発生しました:', error)
      await interaction.reply({
        content: 'このコマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      })
    }
  })().catch((error) =>
    console.error('インタラクションの処理に失敗しました:', error)
  )
})

// ボットをログインさせる
void client.login(token)
