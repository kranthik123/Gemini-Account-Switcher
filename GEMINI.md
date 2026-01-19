# Account Switcher Extension

Manage multiple Google OAuth accounts for Gemini CLI.

## Available Tools

This extension provides MCP tools for account management:

| Tool | Description |
| ---- | ----------- |
| `account_list` | Show all saved profiles |
| `account_save` | Save current login as a profile (requires `name` parameter) |
| `account_switch` | Switch to a saved profile (requires `name` parameter) |
| `account_delete` | Remove a saved profile (requires `name` parameter) |
| `account_current` | Show active profile |
| `account_add` | Save current session and get instructions for adding another account |

## When to Use These Tools

- **User says "list profiles" or "show accounts"** → Call `account_list`
- **User says "save profile work" or "save as work"** → Call `account_save` with name="work"
- **User says "switch to personal" or "use personal account"** → Call `account_switch` with name="personal"
- **User says "delete profile test"** → Call `account_delete` with name="test"
- **User says "which profile" or "current account"** → Call `account_current`
- **User says "add another account" or "setup new profile"** → Call `account_add` with the name they specify

## Important Notes

- After switching profiles, user must restart Gemini CLI (`/quit` then `gemini`)
- Profile names: 1-32 characters, must start with a letter
- Credentials are stored securely in `~/.gemini/accounts/`

## Quick Start Workflow

1. User logs in with first Google account
2. Call `account_save` with name="work" 
3. User runs `/auth logout` then `/auth login` with another account
4. Call `account_save` with name="personal"
5. Now user can switch between them using `account_switch`
