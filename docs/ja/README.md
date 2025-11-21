# Discord Bot

[![CI](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml)
[![Release](https://github.com/11gather11/discord-bot/actions/workflows/release.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/release.yml)
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

`.env`を編集して認証情報を入力してください。利用可能なオプションは[.env.example](../../.env.example)を参照。

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
bun run dev            # ホットリロード付き開発モード
bun run typecheck      # 型チェック
bun run check          # Lint & フォーマット
```

全スクリプトは`package.json`を参照。

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

コントリビューション歓迎！ガイドラインは[CONTRIBUTING.md](../../CONTRIBUTING.md)を参照。

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。

## 謝辞

以下を使用して構築されています：
- [discord.js](https://discord.js.org/) - Discord APIライブラリ
- [Bun](https://bun.sh) - 高速なJavaScriptランタイム
- [Biome](https://biomejs.dev/) - 高速なフォーマッターとリンター
