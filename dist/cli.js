#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini Account Switcher CLI
 * Simple command-line interface for managing OAuth profiles
 */
import { listProfiles, saveProfile, switchProfile, deleteProfile, getCurrentProfile, } from "./profiles.js";
// ANSI colors
const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
};
function success(msg) {
    console.log(`${colors.green}✓${colors.reset} ${msg}`);
}
function error(msg) {
    console.error(`${colors.red}✗${colors.reset} ${msg}`);
}
function header(title) {
    console.log(`\n${colors.cyan}${"─".repeat(45)}${colors.reset}`);
    console.log(`${colors.bold}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}${"─".repeat(45)}${colors.reset}`);
}
async function cmdList() {
    const { profiles, current } = await listProfiles();
    header("SAVED PROFILES");
    if (profiles.length === 0) {
        console.log(`\n  ${colors.dim}No saved profiles yet.${colors.reset}`);
        console.log(`  ${colors.dim}Use 'gemini-accounts save <name>' to save current session.${colors.reset}\n`);
        return;
    }
    console.log();
    for (const p of profiles) {
        const marker = p.name === current ? `${colors.green}● active${colors.reset}` : "";
        const email = p.email ? `${colors.dim}(${p.email})${colors.reset}` : "";
        const name = p.name === current
            ? `${colors.green}${colors.bold}${p.name}${colors.reset}`
            : p.name;
        console.log(`  • ${name} ${email} ${marker}`);
    }
    console.log();
}
async function cmdSave(profileName) {
    if (!profileName) {
        error("Please specify a profile name: gemini-accounts save <name>");
        return;
    }
    try {
        const result = await saveProfile(profileName);
        success(result);
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
async function cmdSwitch(profileName) {
    if (!profileName) {
        error("Please specify a profile: gemini-accounts switch <name>");
        console.log("\nAvailable profiles:");
        await cmdList();
        return;
    }
    try {
        const result = await switchProfile(profileName);
        success(result);
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
async function cmdDelete(profileName) {
    if (!profileName) {
        error("Please specify a profile: gemini-accounts delete <name>");
        return;
    }
    try {
        const result = await deleteProfile(profileName);
        success(result);
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
async function cmdCurrent() {
    try {
        const result = await getCurrentProfile();
        console.log(result);
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
async function cmdAdd(profileName) {
    if (!profileName) {
        error("Please specify a profile name: gemini-accounts add <name>");
        return;
    }
    try {
        const result = await saveProfile(profileName);
        success(result);
        console.log(`
${colors.cyan}NEXT STEPS TO ADD ANOTHER ACCOUNT:${colors.reset}
${"─".repeat(40)}
1. Run: ${colors.bold}/auth logout${colors.reset}
2. Run: ${colors.bold}/auth login${colors.reset} (choose a different Google account)
3. Run: ${colors.bold}gemini-accounts save <new-profile-name>${colors.reset}

${colors.dim}Example:${colors.reset}
  - You just saved "${profileName}"
  - After logging in with another account, save as "personal"
  - Then use: gemini-accounts switch ${profileName}
`);
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
function showHelp() {
    header("ACCOUNT SWITCHER");
    console.log(`
  ${colors.bold}Commands:${colors.reset}

    list                    Show all saved profiles
    save <name>             Save current session as a profile
    switch <name>           Switch to a saved profile
    delete <name>           Delete a saved profile
    current                 Show active profile
    add <name>              Save current & show steps to add another
    help                    Show this help

  ${colors.bold}Examples:${colors.reset}

    gemini-accounts list
    gemini-accounts save work
    gemini-accounts switch personal
    gemini-accounts add work    # Save + show next steps
`);
}
async function main() {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase() || "help";
    const argument = args.slice(1).join(" ");
    try {
        switch (command) {
            case "list":
            case "ls":
                await cmdList();
                break;
            case "save":
                await cmdSave(argument);
                break;
            case "add":
            case "setup":
                await cmdAdd(argument);
                break;
            case "switch":
            case "use":
            case "sw":
                await cmdSwitch(argument);
                break;
            case "delete":
            case "del":
            case "rm":
                await cmdDelete(argument);
                break;
            case "current":
            case "active":
            case "status":
                await cmdCurrent();
                break;
            case "help":
            case "-h":
            case "--help":
                showHelp();
                break;
            default:
                error(`Unknown command: ${command}`);
                showHelp();
                process.exitCode = 1;
        }
    }
    catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    }
}
main();
//# sourceMappingURL=cli.js.map