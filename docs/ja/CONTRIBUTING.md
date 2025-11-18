# Discord Bot へのコントリビューション

**言語**: [English](../../CONTRIBUTING.md) | [日本語](./CONTRIBUTING.md)

コントリビューションに興味を持っていただきありがとうございます！このドキュメントは、本プロジェクトへの貢献ガイドラインを提供します。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発ワークフロー](#開発ワークフロー)
- [コーディングガイドライン](#コーディングガイドライン)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [バージョニング & Changesets](#バージョニング--changesets)
- [プルリクエストプロセス](#プルリクエストプロセス)

## 開発環境のセットアップ

### 前提条件

- [Bun](https://bun.sh) v1.3.2以上
- Discord Bot トークンとAPI認証情報

### インストール

1. リポジトリをフォークしてクローンします：
```bash
git clone https://github.com/11gather11/discord-bot.git
cd discord-bot
```

2. 依存関係をインストールします：
```bash
bun install
```

3. 環境変数を設定します：
```bash
cp .env.example .env
```

4. `.env`を編集して認証情報を入力します：
   - **必須**: `DISCORD_GUILD_ID`, `DISCORD_TOKEN`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `YOUTUBE_API_KEY`
   - **チャンネルID**: `DISCORD_STREAMS_CHANNEL_ID`, `DISCORD_VIDEOS_CHANNEL_ID`
   - **オプション**: Twitter連携、ログWebhook、メンバー数チャンネル

5. Botを起動します：
```bash
bun run src/index.ts
```

### 型チェックの実行

```bash
bun run typecheck
```

## 開発ワークフロー

### ブランチ命名規則

わかりやすい名前でフィーチャーブランチを作成します：

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/bug-description
git checkout -b docs/documentation-update
```

**命名パターン:**
- `feature/*` - 新機能
- `fix/*` - バグ修正
- `docs/*` - ドキュメント更新
- `refactor/*` - コードリファクタリング
- `chore/*` - メンテナンスタスク

### 変更の作成

1. 適切なディレクトリで変更を行います：
   - `src/lib/` - API連携（YouTube、Twitchなど）
   - `src/services/` - ビジネスロジック（通知など）
   - `src/commands/` - Discordコマンド
   - `src/config/` - 設定

2. コーディングガイドラインに従います（後述）

3. 型チェックを実行します：
```bash
bun run typecheck
```

4. **changesetを作成します**（重要な変更の場合）：
```bash
bun run changeset
```

これにより以下が実行されます：
- 変更タイプの選択を求められます（major/minor/patch）
- 変更の概要を入力します
- `.changeset/`にchangesetファイルが作成されます

**changesetを作成する場合:**
- ✅ 新機能（`minor`）
- ✅ バグ修正（`patch`）
- ✅ 破壊的変更（`major`）
- ❌ ドキュメントのみの変更
- ❌ コードフォーマット・lintの修正

## コーディングガイドライン

### 基本原則

詳細なコーディング基準については[CLAUDE.md](../../CLAUDE.md)をお読みください。主要なポイント：

**環境変数:**
- ❌ `process.env`（トップレベル）
- ✅ `import.meta.env`（関数内）

**エラーハンドリング:**
- エラーメッセージに`[ServiceName]`プレフィックスを使用
- 例：`throw new Error('[YouTube] API key is not set')`

**関数名:**
- ファイルコンテキストが明確な場合、冗長なプレフィックスを削除
- 例：`youtube.ts`内では`fetchVideo()`を使用（`fetchYouTubeVideo()`ではない）

**コメント:**
- コメントは**英語**で記述
- 関数名とシグネチャで意図が明確な場合、不要なJSDocは避ける

**コード構造:**
- 定数、ヘルパー関数、エクスポート関数を分離
- 関数を小さく保ち、単一責任に集中

### オプショナル vs 必須サービス

**必須サービス**（環境変数がない場合はエラーを投げる）:
- Twitch、YouTube

**オプショナルサービス**（環境変数がない場合は`null`を返す）:
- Twitter、Member Count

例：
```typescript
// オプショナルサービス
const getTwitterConfig = (): TwitterApi | null => {
  const apiKey = import.meta.env.TWITTER_API_KEY
  if (!apiKey) {
    return null // gracefullyスキップ
  }
  return new TwitterApi({ apiKey })
}
```

## コミットメッセージ規約

このプロジェクトは[Conventional Commits](https://www.conventionalcommits.org/)を使用します。

### フォーマット

```
<type>: <description>

[optional body]

[optional footer]
```

### タイプ

- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイル変更（フォーマットなど）
- `refactor:` - コードリファクタリング
- `test:` - テストの追加または更新
- `chore:` - メンテナンスタスク（依存関係、設定など）

### 例

```bash
feat: add Twitter notification support
fix: handle YouTube API rate limit errors
docs: update CONTRIBUTING.md with commit conventions
refactor: simplify Twitch notification logic
chore: update dependencies to latest versions
```

## バージョニング & Changesets

このプロジェクトは[Changesets](https://github.com/changesets/changesets)を使用してバージョン管理と自動リリースを行います。

### Changesetとは？

changesetは、変更内容とバージョニングへの影響を記述する小さなファイルです。これにより以下が可能になります：
- 複数のPRにわたる変更のトラッキング
- CHANGELOGエントリの自動生成
- バージョンアップとリリースの自動化

### Changesetを作成するタイミング

**changesetを作成する:**
- ✅ 新機能
- ✅ バグ修正
- ✅ 破壊的変更
- ✅ パフォーマンス改善
- ✅ ユーザーまたは開発者に影響を与える変更

**changesetをスキップする:**
- ❌ ドキュメントのみの更新
- ❌ コードフォーマット・lintの修正
- ❌ 外部への影響がない内部リファクタリング
- ❌ CI/CD設定の変更

### Changesetの作成方法

1. changesetコマンドを実行します：
```bash
bun run changeset
```

2. 変更タイプを選択します：
   - **Patch** (`0.0.X`) - バグ修正、小規模改善
   - **Minor** (`0.X.0`) - 新機能、後方互換性のある変更
   - **Major** (`X.0.0`) - 破壊的変更

3. 明確な概要を記述します：
```markdown
# 良い例
- Add support for Discord forum channels
- Fix Twitch notification duplicate messages
- Update YouTube API to v4

# 悪い例
- fixed bug
- updates
- changes
```

4. 生成されたchangesetファイルをコミットします：
```bash
git add .changeset/*.md
git commit -m "feat: add forum channel support"
```

### Changesetフロー

```text
あなたのPR → mainにマージ → "Version Packages" PRが自動作成
                          ↓
               Version PRをマージ → リリース & デプロイ
```

PRがマージされた後：
1. GitHub Actionsが自動的に「Version Packages」PRを作成
2. このPRには最終リリース以降のすべてのchangesetが含まれます
3. マージされると以下がトリガーされます：
   - `package.json`のバージョンアップ
   - CHANGELOGの更新
   - Gitタグの作成
   - GitHub Releaseの作成
   - 自動デプロイ

## プルリクエストプロセス

### 提出前

1. ✅ 型チェックを実行: `bun run typecheck`
2. ✅ コーディングガイドラインに従っているか確認
3. ✅ changesetを作成（該当する場合）: `bun run changeset`
4. ✅ changesetファイル（`.changeset/*.md`）を変更と一緒にコミット
5. ✅ Conventional Commitsに従った明確なコミットメッセージを記述
6. ✅ 必要に応じてドキュメントを更新

### PRの提出

1. ブランチをフォークにプッシュします：
```bash
git push origin feature/your-feature-name
```

2. GitHubでプルリクエストを開きます

3. PRテンプレートに以下を記入します：
   - 変更内容の明確な説明
   - 関連するIssue番号（該当する場合）
   - スクリーンショット/デモ（該当する場合）

4. 自動的にラベルが付与されるのを待ちます

5. レビューフィードバックがあれば対応します

### PRラベル

ラベルは変更されたファイルに基づいて自動的に付与されます：

**エリアラベル:**
- `area/lib` - API連携の変更
- `area/services` - ビジネスロジックの変更
- `area/commands` - Discordコマンドの変更
- `area/config` - 設定の変更

**タイプラベル:**
- `type/docs` - ドキュメント更新
- `type/dependencies` - 依存関係の変更

**サービスラベル:**
- `service/twitch` - Twitch関連の変更
- `service/youtube` - YouTube関連の変更

## 質問がありますか？

質問やヘルプが必要な場合は、お気軽に：
- Issueを開いてディスカッション
- プルリクエストのコメントで質問

コントリビューションありがとうございます！ 🎉
