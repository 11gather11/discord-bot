import { Client, Events, GatewayIntentBits } from 'discord.js'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込む
dotenv.config()

// 新しいClientインスタンスを作成
const client = new Client({
  // このボットがどのイベントを受け取るかを設定
  intents: [
    // サーバーの情報を受け取るための権限
    GatewayIntentBits.Guilds,
    // サーバー内のメッセージを受け取るための権限
    GatewayIntentBits.GuildMessages,
    // メッセージの内容を受け取るための権限
    GatewayIntentBits.MessageContent,
  ],
})

// ボットのトークンを環境変数から取得
const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

if (!token || !clientId || !guildId) {
  console.error('環境変数が設定されていません。')
  process.exit(1)
}

// ボットが起動したときに実行されるイベント
client.once(Events.ClientReady, (client) => {
  console.log(`準備OK! ${client.user.tag}がログインします。`)
})

// ボットをログインさせる
void client.login(token)
