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

### 参考実装
- `src/lib/logger.ts` - 基本パターン
- `src/lib/youtube.ts` - API統合の例
- `src/lib/twitch.ts` - API統合の例
