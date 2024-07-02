import * as fs from 'fs'
import * as path from 'path'
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  type CommandInteraction,
  type Interaction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込む
dotenv.config()

// コマンドの型定義
interface Command {
  data: RESTPostAPIApplicationCommandsJSONBody
  execute: (interaction: CommandInteraction) => Promise<void>
}

// 新しいClientインスタンスを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// コマンドのコレクションを作成
const commands = new Collection<string, Command>()

// コマンドファイルを読み込む
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.ts'))

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  import(filePath)
    .then((commandModule) => {
      const command = commandModule as Command
      // コマンドデータをセット
      commands.set(command.data.name, command)
    })
    .catch((error) => console.error(`Error loading command ${file}:`, error))
}

// ボットのトークンを環境変数から取得
const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

if (!token || !clientId || !guildId) {
  console.error('環境変数が設定されていません。')
  process.exit(1)
}

// ボットが起動したときに実行されるイベント
client.once(Events.ClientReady, (client): void => {
  // クライアントがログインしたときに実行される処理
  ;(async (): Promise<void> => {
    console.log(`準備OK! ${client.user.tag}がログインします。`)

    // スラッシュコマンドを登録
    const guild = client.guilds.cache.get(guildId)
    if (!guild) {
      console.error('Guild not found')
      return
    }

    // コマンドデータを取得し、型を明示的に指定
    const commandData: RESTPostAPIApplicationCommandsJSONBody[] = commands.map(
      (command) => command.data
    )
    await guild.commands.set(commandData)
  })().catch((error) => console.error('Failed to register commands:', error))
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
      console.error(error)
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
    }
  })().catch((error) => console.error('Failed to handle interaction:', error))
})

// ボットをログインさせる
void client.login(token)
