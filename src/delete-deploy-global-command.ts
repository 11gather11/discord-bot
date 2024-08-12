import { REST, Routes } from 'discord.js'

// 環境変数
const { DISCORD_CLIENT_ID, DISCORD_TOKEN } = process.env
if (!(DISCORD_CLIENT_ID && DISCORD_TOKEN)) {
	console.error('環境変数が設定されていません')
	process.exit(1)
}

export const deleteDeployCommands = async () => {
	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)
	try {
		console.log('アプリケーションコマンドを削除します。')
		await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
			body: [],
		})
		console.log('アプリケーションコマンドを削除しました。')
	} catch (error) {
		console.error(error)
	}
}

deleteDeployCommands().catch(console.error)
