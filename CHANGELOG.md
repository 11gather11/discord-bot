# discord-bot

## 1.0.9

### Patch Changes

- [#46](https://github.com/11gather11/discord-bot/pull/46) [`70effab`](https://github.com/11gather11/discord-bot/commit/70effab678f0b0af5b0f0610ec756c19988bf9af) Thanks [@11gather11](https://github.com/11gather11)! - Simplify README documentation and update Docker startup

## 1.0.8

### Patch Changes

- [#44](https://github.com/11gather11/discord-bot/pull/44) [`0f71962`](https://github.com/11gather11/discord-bot/commit/0f719628f8709288c76033c95555a44bace16a13) Thanks [@11gather11](https://github.com/11gather11)! - Remove redundant member count success logs that were outputting every 10 minutes

## 1.0.7

### Patch Changes

- [#41](https://github.com/11gather11/discord-bot/pull/41) [`799acb9`](https://github.com/11gather11/discord-bot/commit/799acb9d445731f121fe6a83f2eb9ef1478eb8cc) Thanks [@11gather11](https://github.com/11gather11)! - Support ARM64 platform for Docker images and auto-deploy docker-compose.yml to VPS

## 1.0.6

### Patch Changes

- [#37](https://github.com/11gather11/discord-bot/pull/37) [`ac625a4`](https://github.com/11gather11/discord-bot/commit/ac625a4351165c9772848a6b07964dcf2f90b759) Thanks [@11gather11](https://github.com/11gather11)! - test

## 1.0.5

### Patch Changes

- [#34](https://github.com/11gather11/discord-bot/pull/34) [`224b8c9`](https://github.com/11gather11/discord-bot/commit/224b8c9979c7acc0da6a3342f47ba4c063974ba2) Thanks [@11gather11](https://github.com/11gather11)! - Integrate deploy process into release workflow to fix deployment automation

## 1.0.4

### Patch Changes

- [#32](https://github.com/11gather11/discord-bot/pull/32) [`dc92b64`](https://github.com/11gather11/discord-bot/commit/dc92b6457397bda1c90ce45e7738ca9c5d1fe647) Thanks [@11gather11](https://github.com/11gather11)! - fix: use version change detection for GitHub Release creation

  Replace publish script approach with version change detection. The workflow now compares package.json versions between commits to accurately determine when to create GitHub Releases, preventing false triggers from non-version-bump PRs.

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
