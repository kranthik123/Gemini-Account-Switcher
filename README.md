# Gemini-Account-Switcher

Switch between multiple Google OAuth accounts in Gemini CLI - Seamless quota management for automation workflows.

## 🎯 What is Account Switcher?

Account Switcher is a lightweight MCP extension that enables:
1. **Save** your current OAuth session as a named profile
2. **Switch** between saved profiles instantly
3. **Manage** multiple Google accounts without re-authenticating
4. **Automate** quota rotation for uninterrupted workflows

### Key Insight

When API quota is exhausted on one account, simply switch to another and continue working. Perfect for automation tools that need to run overnight or handle heavy workloads.

### Real-World Use Cases

- ✅ Rotate accounts when quota is exhausted during long automation sessions (e.g., Ralph Loop)
- ✅ Separate work and personal accounts
- ✅ Development vs. production credential isolation
- ✅ Automated failover in CI/CD pipelines

## ✨ Features

| Feature                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| **MCP-based Tools**           | Native Gemini CLI integration via Model Context Protocol |
| **Zero Dependencies**         | No runtime dependencies beyond Node.js                 |
| **Secure Storage**            | Credentials stored with 600 permissions                |
| **Path Traversal Protection** | Strict profile name validation prevents exploits       |
| **Automatic Backups**         | Creates timestamped backups before switching (keeps 5) |
| **Cross-Platform**            | Works on Windows, macOS, and Linux                     |

## 📁 Project Structure

```
Gemini-Account-Switcher/
├── src/
│   ├── server.ts           # MCP server exposing account tools
│   ├── cli.ts              # Standalone CLI entry point
│   ├── profiles.ts         # Profile CRUD operations
│   └── utils.ts            # File system utilities and validation
├── dist/                   # Compiled JavaScript output
├── gemini-extension.json   # Extension manifest with MCP config
├── GEMINI.md               # Context file for Gemini CLI
├── package.json            # Node.js package configuration
├── tsconfig.json           # TypeScript configuration
└── LICENSE                 # Apache-2.0 License
```

## 📦 Installation

### From GitHub (Recommended)

```bash
# Install the extension
gemini extensions install https://github.com/kranthik123/Gemini-Account-Switcher

# Enable auto-updates (recommended)
gemini extensions install https://github.com/kranthik123/Gemini-Account-Switcher --auto-update
```

### For Development

```bash
# Clone the repository
git clone https://github.com/kranthik123/Gemini-Account-Switcher.git
cd Gemini-Account-Switcher

# Install dependencies
npm install

# Build the extension
npm run build

# Link for development
gemini extensions link .
```

### Verify Installation

```bash
# List installed extensions
gemini extensions list

# Start Gemini CLI - the MCP tools will be available
gemini
```

## 🚀 Quick Start

### Using MCP Tools (Natural Language)

Once installed, just talk to Gemini naturally:

```
> list my profiles
> save this as "work"
> switch to personal
> which account am I using?
> add another account called "testing"
```

### Available MCP Tools

| Tool | Description |
| ---- | ----------- |
| `account_list` | Show all saved profiles |
| `account_save` | Save current login as a profile |
| `account_switch` | Switch to a saved profile |
| `account_delete` | Remove a saved profile |
| `account_current` | Show active profile |
| `account_add` | Save current session and get instructions for adding another |

### Complete Workflow Example

```
# 1. Login to Gemini CLI with your first account
> save my profile as "work"
✓ Saved profile "work" (work@company.com).

# 2. Add another account
> add another account called "personal"
✓ Saved profile "personal".

NEXT STEPS TO ADD ANOTHER ACCOUNT:
───────────────────────────────────
1. Run: /auth logout
2. Run: /auth login (choose a different Google account)
3. Save the new profile

# 3. After logging in with another account
> save as personal
✓ Saved profile "personal" (me@gmail.com).

# 4. Now switch between them anytime
> switch to work
✓ Switched to profile "work" (work@company.com).

⚠️  Restart required: Type /quit then run 'gemini' again.
```

## 📖 Standalone CLI

You can also use the standalone CLI directly:

```bash
# Show help
node dist/cli.js help

# List profiles
node dist/cli.js list

# Save current session
node dist/cli.js save work

# Add account (save + show next steps)
node dist/cli.js add work

# Switch account
node dist/cli.js switch personal

# Delete profile
node dist/cli.js delete old-account

# Show current profile
node dist/cli.js current
```

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

## 🔧 Automation Integration

### Quota Rotation Example

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

## 🛠️ Development

### Available Scripts

```bash
npm install     # Install dependencies
npm run build   # Compile TypeScript
npm run watch   # Watch mode for development
npm run clean   # Remove dist folder
npm run rebuild # Clean + build
```

### Tech Stack

- **TypeScript** - Type-safe development
- **Node.js 18+** - Runtime environment
- **MCP SDK** - Model Context Protocol integration
- **ES Modules** - Modern JavaScript modules

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

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - The CLI this extension enhances
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol powering the integration

## 📚 Resources

- [Gemini CLI Documentation](https://geminicli.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Building Gemini Extensions](https://geminicli.com/docs/extensions/getting-started-extensions/)

## 📜 License

Apache-2.0 License - see [LICENSE](LICENSE) file.

---

> **Disclaimer**: This extension is for educational and personal use. Always use responsibly and respect API rate limits and terms of service.

Made with ❤️ by [Kranthi Kavuri](https://github.com/kranthik123)
