# Gemini Account Switcher

Switch between multiple Google OAuth accounts in Gemini CLI — seamless quota management for automation workflows.

## 🎯 What is Account Switcher?

Account Switcher is a lightweight MCP extension that enables:
1. **Save** your current OAuth session as a named profile
2. **Switch** between saved profiles instantly
3. **Manage** multiple Google accounts without re-authenticating
4. **Automate** quota rotation for uninterrupted workflows

### Key Insight

When API quota is exhausted on one account, simply switch to another and continue working. Perfect for automation tools that need to run overnight or handle heavy workloads.

### Real-World Use Cases

- ✅ Rotate accounts when quota is exhausted during long automation sessions
- ✅ Separate work and personal accounts
- ✅ Development vs. production credential isolation
- ✅ Automated failover in CI/CD pipelines

## ✨ Features

| Feature                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| **MCP-based Tools**           | Native Gemini CLI integration via Model Context Protocol |
| **Self-Contained Bundle**     | Pre-built with all dependencies — no npm install needed |
| **Secure Storage**            | Credentials stored with 600 permissions                |
| **Path Traversal Protection** | Strict profile name validation prevents exploits       |
| **Automatic Backups**         | Creates timestamped backups before switching (keeps 5) |
| **Cross-Platform**            | Works on Windows, macOS, and Linux                     |

## 📦 Installation

### From GitHub (Recommended)

```bash
gemini extensions install https://github.com/kranthik123/Gemini-Account-Switcher.git
```

### Verify Installation

```bash
# List installed extensions
gemini extensions list

# Start Gemini CLI and check MCP connection
gemini
/mcp list
```

You should see:
```
🟢 accountSwitcher (from gemini-account-switcher) - Ready (6 tools)
```

## 🚀 Quick Start

### Step 1: Save Your First Profile

Start Gemini CLI and save your current OAuth session:

```
> save my profile as work
╭─────────────────────────────────────────────────────────────────╮
│ ✓  account_save (accountSwitcher MCP Server) {"name":"work"}    │
│                                                                 │
│ ✓ Saved profile "work".                                         │
╰─────────────────────────────────────────────────────────────────╯
```

### Step 2: Add Another Account

```
> add another account

╭─────────────────────────────────────────────────────────────────╮
│ ✓  account_add (accountSwitcher MCP Server) {"name":"work"}     │
│                                                                 │
│ ✓ Updated profile "work".                                       │
│                                                                 │
│ NEXT STEPS TO ADD ANOTHER ACCOUNT:                              │
│ ───────────────────────────────────                             │
│ 1. Run: /auth logout                                            │
│ 2. Run: /auth login (choose a different Google account)         │
│ 3. Run: account_save with the new profile name                  │
╰─────────────────────────────────────────────────────────────────╯
```

Then run `/auth login`, authenticate with a different Google account, and save it:

```
> save my profile as personal
╭─────────────────────────────────────────────────────────────────╮
│ ✓  account_save (accountSwitcher MCP Server) {"name":"personal"}│
│                                                                 │
│ ✓ Saved profile "personal".                                     │
╰─────────────────────────────────────────────────────────────────╯
```

### Step 3: List Your Profiles

```
> list my profiles

╭─────────────────────────────────────────────────────────────────╮
│ ✓  account_list (accountSwitcher MCP Server) {}                 │
│                                                                 │
│ SAVED PROFILES                                                  │
│ ────────────────────────────────────────                        │
│ • personal ● active                                             │
│ • work                                                          │
╰─────────────────────────────────────────────────────────────────╯
```

### Step 4: Switch Between Accounts

```
> switch to work

╭─────────────────────────────────────────────────────────────────╮
│ ✓  account_switch (accountSwitcher MCP Server) {"name":"work"}  │
│                                                                 │
│ ✓ Switched to profile "work".                                   │
│                                                                 │
│ ⚠️  Restart required: Type /quit then run 'gemini' again.       │
╰─────────────────────────────────────────────────────────────────╯
```

**Important:** After switching, type `/quit` and restart `gemini` for the change to take effect.

## 📖 Available MCP Tools

| Tool             | Description                                              | Example Prompts                    |
| ---------------- | -------------------------------------------------------- | ---------------------------------- |
| `account_list`   | Show all saved profiles                                  | "list my profiles", "show accounts"|
| `account_save`   | Save current login as a profile                          | "save as work", "save profile dev" |
| `account_switch` | Switch to a saved profile                                | "switch to personal", "use work"   |
| `account_delete` | Remove a saved profile                                   | "delete profile test"              |
| `account_current`| Show active profile                                      | "which account?", "current profile"|
| `account_add`    | Save current session and get instructions for adding more| "add another account"              |

### Profile Name Rules

- Must start with a letter
- Can contain letters, numbers, hyphens (`-`), and underscores (`_`)
- Length: 1-32 characters
- **No dots allowed** (e.g., `kranthi.work` is invalid, use `kranthi-work` instead)

## 🔒 Security

### How Credentials Are Stored

```
~/.gemini/
├── oauth_creds.json          # Active credentials (used by Gemini CLI)
└── accounts/
    ├── .current_profile      # Tracks active profile name
    ├── work/
    │   └── oauth_creds.json  # Saved profile credentials
    └── personal/
        └── oauth_creds.json
```

### Security Measures

| Protection                   | Implementation                                  |
| ---------------------------- | ----------------------------------------------- |
| **File Permissions**         | All credential files use `0600` (owner only)    |
| **Directory Permissions**    | Account directories use `0700`                  |
| **Profile Validation**       | Names must match `^[a-zA-Z][a-zA-Z0-9_-]{0,31}$`|
| **Reserved Names Blocked**   | `.`, `..`, `con`, `prn`, `aux`, `nul`           |
| **Backup Rotation**          | Keeps only last 5 backups                       |

## 📁 Project Structure

```
Gemini-Account-Switcher/
├── src/
│   ├── server.ts           # MCP server exposing account tools
│   ├── cli.ts              # Standalone CLI entry point
│   ├── profiles.ts         # Profile CRUD operations
│   └── utils.ts            # File system utilities and validation
├── dist/                   # Pre-built JavaScript (bundled with esbuild)
├── gemini-extension.json   # Extension manifest with MCP config
├── GEMINI.md               # Context file for Gemini CLI
├── package.json            # Node.js package configuration
├── tsconfig.json           # TypeScript configuration
└── LICENSE                 # Apache-2.0 License
```

## 🔧 Automation Integration

### Quota Rotation Example (Python)

```python
import subprocess

def switch_gemini_account(profile_name):
    """Switch Gemini CLI to a different OAuth profile."""
    result = subprocess.run(
        ["node", "path/to/dist/cli.js", "switch", profile_name],
        capture_output=True,
        text=True
    )
    return result.returncode == 0

def handle_quota_exhausted():
    """Called when Gemini API returns quota exceeded error."""
    accounts = ["account1", "account2", "account3"]
    current = get_current_account()  # Your tracking logic
    
    next_idx = (accounts.index(current) + 1) % len(accounts)
    next_account = accounts[next_idx]
    
    if switch_gemini_account(next_account):
        print(f"Switched to {next_account}, restarting Gemini CLI...")
        restart_gemini_cli()
```

### Standalone CLI (Alternative)

You can also use the CLI directly without MCP:

```bash
# List profiles
node dist/cli.js list

# Save current session
node dist/cli.js save work

# Switch account
node dist/cli.js switch personal

# Show current profile
node dist/cli.js current

# Delete profile
node dist/cli.js delete old-account

# Show help
node dist/cli.js help
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/kranthik123/Gemini-Account-Switcher.git
cd Gemini-Account-Switcher

# Install dependencies
npm install

# Build (TypeScript + esbuild bundle)
npm run build

# Link for local development
gemini extensions link .
```

### Available Scripts

| Script           | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run build`  | Compile TypeScript and bundle with esbuild       |
| `npm run watch`  | Watch mode for TypeScript development            |
| `npm run clean`  | Remove dist folder                               |
| `npm run rebuild`| Clean + build                                    |

### Tech Stack

- **TypeScript** — Type-safe development
- **esbuild** — Fast bundling with zero runtime dependencies
- **Node.js 18+** — Runtime environment
- **MCP SDK** — Model Context Protocol integration
- **ES Modules** — Modern JavaScript modules

## ⚠️ Important Notes

1. **Restart Required**: After switching profiles, restart Gemini CLI (`/quit` then `gemini`)
2. **Credential Validity**: Saved credentials may expire. If authentication fails, re-login and save again.
3. **Terms of Service**: This tool manages your own legitimate OAuth credentials. Ensure compliance with Google's ToS.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — The CLI this extension enhances
- [Model Context Protocol](https://modelcontextprotocol.io/) — The protocol powering the integration

## 📚 Resources

- [Gemini CLI Documentation](https://geminicli.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Building Gemini Extensions](https://geminicli.com/docs/extensions/getting-started-extensions/)

## 📜 License

Apache-2.0 License — see [LICENSE](LICENSE) file.

---

> **Disclaimer**: This extension is for educational and personal use. Always use responsibly and respect API rate limits and terms of service.

Made with ❤️ by [Kranthi Kavuri](https://github.com/kranthik123)
