---
"discord-bot": patch
---

fix: use version change detection for GitHub Release creation

Replace publish script approach with version change detection. The workflow now compares package.json versions between commits to accurately determine when to create GitHub Releases, preventing false triggers from non-version-bump PRs.
