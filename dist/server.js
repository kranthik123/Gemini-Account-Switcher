#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini Account Switcher MCP Server
 * Exposes account management tools via Model Context Protocol
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { listProfiles, saveProfile, switchProfile, deleteProfile, getCurrentProfile, } from "./profiles.js";
// Define available tools
const TOOLS = [
    {
        name: "account_list",
        description: "List all saved Google OAuth account profiles. Shows profile names, associated emails, and which profile is currently active.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "account_save",
        description: "Save the current OAuth session as a named profile. Use this to store the currently logged-in Google account for later switching.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Profile name (1-32 chars, starts with letter, alphanumeric with hyphens/underscores)",
                },
            },
            required: ["name"],
        },
    },
    {
        name: "account_switch",
        description: "Switch to a previously saved OAuth profile. After switching, Gemini CLI must be restarted for changes to take effect.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the profile to switch to",
                },
            },
            required: ["name"],
        },
    },
    {
        name: "account_delete",
        description: "Delete a saved OAuth profile. This removes the stored credentials for that profile.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the profile to delete",
                },
            },
            required: ["name"],
        },
    },
    {
        name: "account_current",
        description: "Show which OAuth profile is currently active.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "account_add",
        description: "Save current session and get instructions for adding another account. Use this when setting up multiple accounts.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Profile name for the current session",
                },
            },
            required: ["name"],
        },
    },
];
// Create MCP server
const server = new Server({
    name: "gemini-account-switcher",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "account_list": {
                const { profiles, current } = await listProfiles();
                if (profiles.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No saved profiles yet.\n\nUse account_save to save your current session.",
                            },
                        ],
                    };
                }
                const lines = ["SAVED PROFILES", "─".repeat(40)];
                for (const p of profiles) {
                    const marker = p.name === current ? " ● active" : "";
                    const email = p.email ? ` (${p.email})` : "";
                    lines.push(`• ${p.name}${email}${marker}`);
                }
                return {
                    content: [{ type: "text", text: lines.join("\n") }],
                };
            }
            case "account_save": {
                const profileName = args.name;
                const result = await saveProfile(profileName);
                return {
                    content: [{ type: "text", text: `✓ ${result}` }],
                };
            }
            case "account_switch": {
                const profileName = args.name;
                const result = await switchProfile(profileName);
                return {
                    content: [{ type: "text", text: `✓ ${result}` }],
                };
            }
            case "account_delete": {
                const profileName = args.name;
                const result = await deleteProfile(profileName);
                return {
                    content: [{ type: "text", text: `✓ ${result}` }],
                };
            }
            case "account_current": {
                const result = await getCurrentProfile();
                return {
                    content: [{ type: "text", text: result }],
                };
            }
            case "account_add": {
                const profileName = args.name;
                const result = await saveProfile(profileName);
                const instructions = `✓ ${result}

NEXT STEPS TO ADD ANOTHER ACCOUNT:
───────────────────────────────────
1. Run: /auth logout
2. Run: /auth login (choose a different Google account)
3. Run: account_save with the new profile name

Example:
  - You just saved "work"
  - After logging in with personal account, save as "personal"
  - Then use account_switch to switch between them`;
                return {
                    content: [{ type: "text", text: instructions }],
                };
            }
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `✗ Error: ${message}` }],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Account Switcher MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map