# Discord Bot

[![CI](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml)
[![Release](https://github.com/11gather11/discord-bot/actions/workflows/release.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/release.yml)
[![Deploy](https://github.com/11gather11/discord-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/github/v/release/11gather11/discord-bot)](https://github.com/11gather11/discord-bot/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**言語**: [English](../../README.md) | [日本語](./README.md)

YouTubeとTwitchのライブ配信通知、Twitter連携、メンバー数トラッキング機能を備えた多機能Discord Bot。

## 機能

- 🎥 **YouTube通知** - 新しい動画アップロードの自動通知
- 📺 **Twitch配信通知** - 配信開始時のリアルタイムアラート
- 🐦 **Twitter連携** - Twitterへの投稿連携（オプション）
- 👥 **メンバー数トラッキング** - サーバーメンバー数をチャンネル名に表示（オプション）
- 🎮 **Discordコマンド** - サーバー操作用のカスタムスラッシュコマンド

## 前提条件

- [Bun](https://bun.sh) v1.3.2以上
- Discord Bot トークン
- YouTube API キー
- Twitch API 認証情報

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/discord-bot-1.git
cd discord-bot-1
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`を編集して認証情報を入力してください：

**必須:**
- `DISCORD_GUILD_ID` - DiscordサーバーID
- `DISCORD_TOKEN` - Discord Botトークン
- `DISCORD_STREAMS_CHANNEL_ID` - Twitch通知用のチャンネルID
- `DISCORD_VIDEOS_CHANNEL_ID` - YouTube通知用のチャンネルID
- `YOUTUBE_API_KEY` - YouTube Data API v3 キー
- `TWITCH_CLIENT_ID` - TwitchアプリケーションのクライアントID
- `TWITCH_CLIENT_SECRET` - Twitchアプリケーションのクライアントシークレット

**オプション:**
- `DISCORD_LOG_WEBHOOK_URL` - ログ記録用のWebhook URL
- `DISCORD_MEMBER_COUNT_CHANNEL_ID` - メンバー数表示用のチャンネル
- `TWITTER_*` - SNS連携用のTwitter API認証情報

### 4. Discordコマンドのデプロイ

```bash
bun run deploy-commands
```

### 5. Botの起動

```bash
bun run dev
```

## 開発

### 利用可能なスクリプト

```bash
# ホットリロード付きの開発モードでBotを起動
bun run dev

# Discordスラッシュコマンドのデプロイ
bun run deploy-commands

# 型チェックの実行
bun run typecheck

# コードのlintとフォーマット
bun run check

# lintとフォーマットの問題を自動修正
bun run check:fix

# バージョニング用のchangesetを作成
bun run changeset

# changesetに基づいてパッケージをバージョンアップ（GitHub Actions経由で自動化）
bun run version
```

### プロジェクト構造

```
src/
├── commands/       # Discordスラッシュコマンド
├── config/         # 設定ファイル
├── handlers/       # イベントとコマンドのハンドラー
├── lib/            # API連携（YouTube、Twitchなど）
├── services/       # ビジネスロジック（通知など）
└── index.ts        # Botのエントリーポイント
```

## バージョニング & リリース

このプロジェクトは[Changesets](https://github.com/changesets/changesets)を使用してバージョン管理と自動リリースを行います。

### Changesetの作成

次回リリースに含めるべき変更を行った場合：

```bash
bun run changeset
```

これにより以下が実行されます：
1. 変更タイプの選択を求められます（major/minor/patch）
2. 変更の概要を入力します
3. `.changeset/`ディレクトリにchangesetファイルが作成されます

**生成されたchangesetファイルをPRと一緒にコミット**してください。

### リリースプロセス

リリースプロセスはGitHub Actionsによって完全に自動化されています：

1. **PRの作成** - 変更とchangesetファイルを含むPRを作成
2. **mainにマージ** - GitHub Actionsが自動的に「Version Packages」PRを作成
3. **Version PRのマージ** - これにより以下がトリガーされます：
   - `package.json`のバージョンアップ
   - `CHANGELOG.md`の更新
   - Gitタグの作成
   - GitHub Releaseの作成
   - 自動デプロイ（設定時）

### 手動バージョニング（ローカルテスト用のみ）

```bash
# changesetに基づいてローカルでバージョンを更新
bun run version
```

**注意:** 本番環境では、バージョニングはGitHub Actionsによって完全に自動化されます。

## デプロイ

このプロジェクトはDockerとGitHub Actionsを使用してVPSへの自動デプロイを行います。

### VPSのセットアップ

1. **DockerとDocker Composeのインストール**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
```

2. **デプロイディレクトリの作成**

```bash
sudo mkdir -p /opt/11gather11-discord-bot
sudo chown $USER:$USER /opt/11gather11-discord-bot
cd /opt/11gather11-discord-bot
```

3. **`.env`ファイルの作成**

```bash
nano .env
```

環境変数を追加してください（[.env.example](../../.env.example)を参照）。

4. **`docker-compose.yml`の作成**

```bash
nano docker-compose.yml
```

[docker-compose.yml](../../docker-compose.yml)の内容をコピーしてください。

5. **GitHub Container Registryにログイン**

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### GitHub Secrets

リポジトリに以下のシークレットを追加してください（**Settings → Secrets and variables → Actions**）：

| Secret | 説明 |
|--------|------|
| `SSH_HOST` | VPSのIPアドレス |
| `SSH_USERNAME` | SSHユーザー名 |
| `SSH_KEY` | SSH秘密鍵 |
| `SSH_PORT` | SSHポート（オプション、デフォルト: 22） |

### デプロイフロー

```
GitHub Release → Dockerイメージのビルド → ghcr.ioへプッシュ → VPSへデプロイ
```

デプロイは「Version Packages」PRをマージすると自動的に実行されます。

### 手動デプロイ

```bash
cd /opt/11gather11-discord-bot
docker compose pull
docker compose up -d
docker compose logs -f
```

## コントリビューション

コントリビューションを歓迎します！ガイドラインについては[CONTRIBUTING.md](../../CONTRIBUTING.md)をご覧ください。

### クイックコントリビューションガイド

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. [CLAUDE.md](../../CLAUDE.md)のコーディングガイドラインに従う
4. [Conventional Commits](https://www.conventionalcommits.org/)でコミットメッセージを作成
5. 型チェックを実行: `bun run typecheck`
6. プルリクエストを提出

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。

## 謝辞

以下を使用して構築されています：
- [discord.js](https://discord.js.org/) - Discord APIライブラリ
- [Bun](https://bun.sh) - 高速なJavaScriptランタイム
- [Biome](https://biomejs.dev/) - 高速なフォーマッターとリンター
