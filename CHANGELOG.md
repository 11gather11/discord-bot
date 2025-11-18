# discord-bot

## 1.0.3

### Patch Changes

- [#30](https://github.com/11gather11/discord-bot/pull/30) [`c8bc16b`](https://github.com/11gather11/discord-bot/commit/c8bc16be15d0a5757346a51c2151612538d523b7) Thanks [@11gather11](https://github.com/11gather11)! - fix: add publish script to enable GitHub Release creation

  Added empty publish script to package.json so changesets/action sets `published: true` after version bumps, enabling proper GitHub Release creation without actually publishing to npm.

## 1.0.2

### Patch Changes

- [#28](https://github.com/11gather11/discord-bot/pull/28) [`01917c2`](https://github.com/11gather11/discord-bot/commit/01917c294b791b99578b4ce2f5fbe3d9436daa2e) Thanks [@11gather11](https://github.com/11gather11)! - feat: add GitHub Release creation step to workflow

## 1.0.1

### Patch Changes

- [#14](https://github.com/11gather11/discord-bot/pull/14) [`0fd137c`](https://github.com/11gather11/discord-bot/commit/0fd137c47c63ce8af131093d0b76239afa8af2ce) Thanks [@11gather11](https://github.com/11gather11)! - Add status badges and multi-language documentation support

  - Add CI, Release, Deploy, Version, and License badges to README
  - Add multi-language documentation structure with Japanese translations
  - Add language switcher links to all documentation files
  - Update CLAUDE.md with multi-language documentation management guidelines
