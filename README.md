# Discord Bot

[![CI](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/ci.yml)
[![Release](https://github.com/11gather11/discord-bot/actions/workflows/release.yml/badge.svg)](https://github.com/11gather11/discord-bot/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/release/11gather11/discord-bot)](https://github.com/11gather11/discord-bot/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Languages**: [English](./README.md) | [日本語](./docs/ja/README.md)

A feature-rich Discord bot with YouTube and Twitch live stream notifications, Twitter integration, and member count tracking.

## Features

- 🎥 **YouTube Notifications** - Automatic notifications for new video uploads
- 📺 **Twitch Live Notifications** - Real-time alerts when streamers go live
- 🐦 **Twitter Integration** - Post updates to Twitter (optional)
- 👥 **Member Count Tracking** - Display server member count in channel name (optional)
- 🎮 **Discord Commands** - Custom slash commands for server interaction

## Prerequisites

- [Bun](https://bun.sh) v1.3.2 or higher
- Discord Bot Token
- YouTube API Key
- Twitch API credentials

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/discord-bot-1.git
cd discord-bot-1
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials. See [.env.example](.env.example) for all available options.

### 4. Deploy Discord commands

```bash
bun run deploy-commands
```

### 5. Run the bot

```bash
bun run dev
```

## Development

### Available Scripts

```bash
bun run dev            # Development mode with hot reload
bun run typecheck      # Type checking
bun run check          # Lint & format
```

See `package.json` for all available scripts.

## Deployment

This project uses Docker and GitHub Actions for automated deployment to VPS.

### VPS Setup

1. **Install Docker and Docker Compose**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
```

2. **Create deployment directory**

```bash
sudo mkdir -p /opt/11gather11-discord-bot
sudo chown $USER:$USER /opt/11gather11-discord-bot
cd /opt/11gather11-discord-bot
```

3. **Create `.env` file**

```bash
nano .env
```

Add your environment variables (see [.env.example](.env.example) for reference).

4. **Create `docker-compose.yml`**

```bash
nano docker-compose.yml
```

Copy the contents from [docker-compose.yml](docker-compose.yml).

5. **Log in to GitHub Container Registry**

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### GitHub Secrets

Add these secrets to your repository (**Settings → Secrets and variables → Actions**):

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | VPS IP address |
| `SSH_USERNAME` | SSH username |
| `SSH_KEY` | SSH private key |
| `SSH_PORT` | SSH port (optional, default: 22) |

### Deployment Flow

```
GitHub Release → Build Docker Image → Push to ghcr.io → Deploy to VPS
```

The deployment happens automatically when you merge the "Version Packages" PR.

### Manual Deployment

```bash
cd /opt/11gather11-discord-bot
docker compose pull
docker compose up -d
docker compose logs -f
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License.

## Acknowledgments

Built with:
- [discord.js](https://discord.js.org/) - Discord API library
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Biome](https://biomejs.dev/) - Fast formatter and linter
