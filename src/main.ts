import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";

// .envファイルから環境変数を読み込む
dotenv.config();

// 新しいClientインスタンスを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

// ボットのトークンを環境変数から取得
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error("DISCORD_BOT_TOKEN is not defined in .env file");
  process.exit(1);
}

// ボットが起動したときに実行されるイベント
client.once("ready", () => {
  console.log("Bot is online!");
});

// メッセージが送信されたときに実行されるイベント
client.on("messageCreate", (message) => {
  // ボット自身のメッセージには反応しないようにする
  if (message.author.bot) return;

  // ユーザーが「!ping」と入力した場合に「Pong!」と応答する
  if (message.content === "!ping") {
    message.channel.send("Pong!");
  }
});

// ボットをログインさせる
client.login(token);
