# Discord Bot

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

Edit `.env` and fill in your credentials:

**Required:**
- `DISCORD_GUILD_ID` - Your Discord server ID
- `DISCORD_TOKEN` - Your Discord bot token
- `DISCORD_STREAMS_CHANNEL_ID` - Channel ID for Twitch notifications
- `DISCORD_VIDEOS_CHANNEL_ID` - Channel ID for YouTube notifications
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key
- `TWITCH_CLIENT_ID` - Your Twitch application client ID
- `TWITCH_CLIENT_SECRET` - Your Twitch application client secret

**Optional:**
- `DISCORD_LOG_WEBHOOK_URL` - Webhook URL for logging
- `DISCORD_MEMBER_COUNT_CHANNEL_ID` - Channel for member count display
- `TWITTER_*` - Twitter API credentials for social integration

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
# Run bot in development mode with hot reload
bun run dev

# Deploy Discord slash commands
bun run deploy-commands

# Run type checking
bun run typecheck

# Lint and format code
bun run check

# Fix linting and formatting issues
bun run check:fix

# Create a changeset for versioning
bun run changeset

# Version packages based on changesets (automated via GitHub Actions)
bun run version
```

### Project Structure

```
src/
├── commands/       # Discord slash commands
├── config/         # Configuration files
├── handlers/       # Event and command handlers
├── lib/            # API integrations (YouTube, Twitch, etc.)
├── services/       # Business logic (notifications, etc.)
└── index.ts        # Bot entry point
```

## Versioning & Release

This project uses [Changesets](https://github.com/changesets/changesets) for version management and automated releases.

### Creating a Changeset

When you make changes that should be included in the next release:

```bash
bun run changeset
```

This will:
1. Prompt you to select the type of change (major/minor/patch)
2. Ask for a summary of the changes
3. Create a changeset file in `.changeset/`

**Commit the generated changeset file** with your PR.

### Release Process

The release process is fully automated via GitHub Actions:

1. **Create a PR** with your changes and changeset file
2. **Merge to main** - GitHub Actions automatically creates a "Version Packages" PR
3. **Merge the Version PR** - This triggers:
   - Version bump in `package.json`
   - `CHANGELOG.md` update
   - Git tag creation
   - GitHub Release creation
   - Automated deployment (when configured)

### Manual Versioning (local testing only)

```bash
# Update versions based on changesets locally
bun run version
```

**Note:** In production, versioning is fully automated via GitHub Actions.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding guidelines in [CLAUDE.md](./CLAUDE.md)
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
5. Run type checking: `bun run typecheck`
6. Submit a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

Built with:
- [discord.js](https://discord.js.org/) - Discord API library
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Biome](https://biomejs.dev/) - Fast formatter and linter
