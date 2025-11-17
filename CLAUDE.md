# CLAUDE.md — Discord Bot プロジェクトガイドライン

> 本文書は、このDiscord Botプロジェクト固有のルールを定義します。

## 【SHOULD】lib/配下のAPI統合モジュールの実装パターン

### 適用範囲
`src/lib/`配下の外部API統合モジュール（YouTube、Twitch等）

### 必須要件

#### 1. 環境変数の取得
- ❌ `process.env`（トップレベル）
- ✅ `import.meta.env`（関数内で取得）

```typescript
// ❌ Bad
const { API_KEY } = process.env
if (!API_KEY) throw new Error('...')

// ✅ Good
const getApiKey = (): string => {
  const apiKey = import.meta.env.API_KEY
  if (!apiKey) {
    throw new Error('[ServiceName] API_KEY is not set')
  }
  return apiKey
}
```

#### 2. 定数分離
APIのベースURLは定数として定義

```typescript
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'
const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix'
```

#### 3. ヘルパー関数の分離
小さな関数に責務を分割

```typescript
const getApiKey = (): string => { /* ... */ }
const buildUrl = (endpoint: string, params: Record<string, string>): string => { /* ... */ }
const fetchApi = async <T>(url: string, errorMessage: string): Promise<T> => { /* ... */ }
```

#### 4. エラーハンドリング
`[ServiceName]` プレフィックス付きエラーメッセージ

```typescript
throw new Error('[YouTube] Channel not found: ${channelId}')
throw new Error('[Twitch] Failed to fetch access token')
```

#### 5. 関数名
ファイル名で明確なコンテキストがある場合、冗長なプレフィックスは削除

```typescript
// ❌ Bad (youtube.ts 内)
export const fetchYouTubeVideo = async (...) => { /* ... */ }

// ✅ Good (youtube.ts 内)
export const fetchVideo = async (...) => { /* ... */ }
```

#### 6. コメント
関数名と型シグネチャで意図が明確な場合はJSDocコメント不要

```typescript
// ❌ Bad
/**
 * Fetches the latest video from a playlist
 * @param uploadsPlaylistId - The playlist ID
 * @returns The latest video
 */
export const fetchLatestVideo = async (uploadsPlaylistId: string): Promise<PlaylistItems> => { /* ... */ }

// ✅ Good
export const fetchLatestVideo = async (uploadsPlaylistId: string): Promise<PlaylistItems> => { /* ... */ }
```

#### 7. コメントの言語
コードコメントは英語で記述する

```typescript
// ❌ Bad
// アップロードプレイリストIDを取得
const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)

// ✅ Good
// Fetch uploads playlist ID
const uploadsPlaylistId = await fetchUploadsPlaylistId(channelId)
```

### 参考実装
- `src/lib/logger.ts` - 基本パターン
- `src/lib/youtube.ts` - API統合の例
- `src/lib/twitch.ts` - API統合の例

## 【SHOULD】services/配下の実装パターン

### 適用範囲
`src/services/`配下のビジネスロジックモジュール（Twitch、YouTube等の通知サービス）

### 必須要件

#### 1. 環境変数の取得
- ❌ `process.env`（トップレベル）
- ✅ `import.meta.env`（関数内で取得）

```typescript
// ❌ Bad
const { DISCORD_GUILD_ID, DISCORD_CHANNEL_ID } = process.env
if (!DISCORD_GUILD_ID || !DISCORD_CHANNEL_ID) throw new Error('...')

// ✅ Good
const getDiscordConfig = (): { guildId: string; channelId: string } => {
  const guildId = import.meta.env.DISCORD_GUILD_ID
  const channelId = import.meta.env.DISCORD_CHANNEL_ID
  if (!(guildId && channelId)) {
    throw new Error('[ServiceName] DISCORD_GUILD_ID and DISCORD_CHANNEL_ID are not set')
  }
  return { guildId, channelId }
}
```

#### 2. 定数分離
タイマー、URL、色、画像URLは定数として定義

```typescript
const CHECK_INTERVAL = 1000 * 60 * 20
const SERVICE_BASE_URL = 'https://example.com'
const SERVICE_COLOR = 0x9146ff
```

#### 3. ヘルパー関数の分離
小さな関数に責務を分割

```typescript
const getDiscordConfig = (): { guildId: string; channelId: string } => { /* ... */ }
const buildEmbed = (...): EmbedBuilder => { /* ... */ }
const sendToDiscord = async (...): Promise<void> => { /* ... */ }
const notifyXxx = async (...): Promise<void> => { /* ... */ }
const handleNotification = async (...): Promise<boolean | string> => { /* ... */ }
const checkStatus = async (...): Promise<void> => { /* ... */ }
```

#### 4. エラーハンドリング
`[ServiceName]` プレフィックス付きエラーメッセージ

```typescript
throw new Error('[Twitch] Failed to fetch access token')
logger.error('[YouTube] Failed to send video notification:', error as Error)
```

#### 5. ログ出力
成功時と失敗時の両方でログを出力

```typescript
// 成功ログ
logger.info(`[Twitch] ${userLogin} の配信開始を検知: ${stream.title}`)

// エラーログ
logger.error('[Twitch] Failed to send stream notification:', error as Error)
```

#### 6. 関数名
ファイル名で明確なコンテキストがある場合、冗長なプレフィックスは削除

```typescript
// ❌ Bad (twitch.ts 内)
export const startTwitchLiveNotification = async (...) => { /* ... */ }

// ✅ Good (twitch.ts 内)
export const startLiveNotification = async (...) => { /* ... */ }
```

#### 7. コメント
関数名と型シグネチャで意図が明確な場合はJSDocコメント不要

```typescript
// ❌ Bad
/**
 * Sends notification to Discord
 * @param client - Discord client
 * @param videoId - Video ID
 */
export const notifyVideo = async (client: Client, videoId: string): Promise<void> => { /* ... */ }

// ✅ Good
export const notifyVideo = async (client: Client, videoId: string): Promise<void> => { /* ... */ }
```

#### 8. コメントの言語
コードコメントは英語で記述する

```typescript
// ❌ Bad
// Twitchチャンネルの監視を開始
const twitchPromises = config.twitch.channels.map((channel) => startLiveNotification(client, channel))

// ✅ Good
// Start monitoring Twitch channels
const twitchPromises = config.twitch.channels.map((channel) => startLiveNotification(client, channel))
```

### 参考実装
- `src/services/twitch.ts` - 配信通知サービスの例
- `src/services/youtube.ts` - 動画通知サービスの例
