import * as fs from 'fs'
import * as path from 'path'
import {
  Collection,
  REST,
  Routes,
  type CommandInteraction,
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

export const commands = new Collection<string, Command>()

export const deployGlobalCommands = async (
  commandsPath: string,
  clientId: string,
  token: string
): Promise<void> => {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.ts'))

  const promises = commandFiles.map(async (file) => {
    const filePath = path.join(commandsPath, file)
    try {
      const command = (await import(filePath)) as Command
      commands.set(command.data.name, command)
    } catch (error) {
      console.error(`${file} のコマンドの読み込みエラー:`, error)
    }
  })

  await Promise.all(promises)
  console.log(`${commands.size} 個のグローバルコマンドが読み込まれました。`)

  // スラッシュコマンドを登録
  const rest = new REST({ version: '10' }).setToken(token)
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = commands.map(
    (command) => command.data
  )

  try {
    await rest.put(Routes.applicationCommands(clientId), {
      body: commandData,
    })
    console.log('グローバルコマンドが正常に登録されました。')
  } catch (error) {
    console.error('グローバルコマンドの登録に失敗しました:', error)
  }
}
