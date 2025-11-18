---
"discord-bot": patch
---

fix: add publish script to enable GitHub Release creation

Added empty publish script to package.json so changesets/action sets `published: true` after version bumps, enabling proper GitHub Release creation without actually publishing to npm.
