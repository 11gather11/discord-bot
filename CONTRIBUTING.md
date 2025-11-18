# Contributing to Discord Bot

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.1.21 or higher
- Discord Bot Token and API credentials

### Installation

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/discord-bot-1.git
cd discord-bot-1
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and fill in your credentials:
   - **Required**: `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `YOUTUBE_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
   - **Channel IDs**: `DISCORD_VIDEOS_CHANNEL_ID`, `DISCORD_STREAMS_CHANNEL_ID`
   - **Optional**: Twitter integration, logging webhook, member count channel

5. Run the bot:
```bash
bun run src/index.ts
```

### Running Type Check

```bash
bun run typecheck
```

## Development Workflow

### Branch Naming Convention

Create a feature branch with a descriptive name:

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/bug-description
git checkout -b docs/documentation-update
```

**Naming patterns:**
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `chore/*` - Maintenance tasks

### Making Changes

1. Make your changes in the appropriate directory:
   - `src/lib/` - API integrations (YouTube, Twitch, etc.)
   - `src/services/` - Business logic (notifications, etc.)
   - `src/commands/` - Discord commands
   - `src/config/` - Configuration

2. Follow the coding guidelines (see below)

3. Run type checking:
```bash
bun run typecheck
```

## Coding Guidelines

### General Principles

Please read [CLAUDE.md](./CLAUDE.md) for detailed coding standards. Key points:

**Environment Variables:**
- ❌ `process.env` (top-level)
- ✅ `import.meta.env` (inside functions)

**Error Handling:**
- Use `[ServiceName]` prefix in error messages
- Example: `throw new Error('[YouTube] API key is not set')`

**Function Naming:**
- Remove redundant prefixes when file context is clear
- Example: In `youtube.ts`, use `fetchVideo()` not `fetchYouTubeVideo()`

**Comments:**
- Write comments in **English**
- Avoid unnecessary JSDoc when function name and signature are self-explanatory

**Code Structure:**
- Separate constants, helper functions, and exported functions
- Keep functions small and focused on single responsibility

### Optional vs Required Services

**Required Services** (throw errors if env vars missing):
- Twitch, YouTube

**Optional Services** (return `null` if env vars missing):
- Twitter, Member Count

Example:
```typescript
// Optional service
const getTwitterConfig = (): TwitterApi | null => {
  const apiKey = import.meta.env.TWITTER_API_KEY
  if (!apiKey) {
    return null // Skip gracefully
  }
  return new TwitterApi({ apiKey })
}
```

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, config, etc.)

### Examples

```bash
feat: add Twitter notification support
fix: handle YouTube API rate limit errors
docs: update CONTRIBUTING.md with commit conventions
refactor: simplify Twitch notification logic
chore: update dependencies to latest versions
```

## Pull Request Process

### Before Submitting

1. ✅ Run type checking: `bun run typecheck`
2. ✅ Ensure your code follows the coding guidelines
3. ✅ Write clear commit messages following Conventional Commits
4. ✅ Update documentation if needed

### Submitting a PR

1. Push your branch to your fork:
```bash
git push origin feature/your-feature-name
```

2. Open a Pull Request on GitHub

3. Fill in the PR template with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots/demos (if applicable)

4. Wait for automated labels to be applied

5. Address review feedback if requested

### PR Labels

Labels are automatically applied based on changed files:

**Area labels:**
- `area/lib` - API integration changes
- `area/services` - Business logic changes
- `area/commands` - Discord command changes
- `area/config` - Configuration changes

**Type labels:**
- `type/docs` - Documentation updates
- `type/dependencies` - Dependency changes

**Service labels:**
- `service/twitch` - Twitch-related changes
- `service/youtube` - YouTube-related changes

## Questions?

If you have questions or need help, feel free to:
- Open an issue for discussion
- Ask in pull request comments

Thank you for contributing! 🎉
