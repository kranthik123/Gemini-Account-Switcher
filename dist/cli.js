#!/usr/bin/env node

// src/profiles.ts
import fs2 from "node:fs/promises";
import path2 from "node:path";

// src/utils.ts
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
var GEMINI_DIR = path.join(os.homedir(), ".gemini");
var ACCOUNTS_DIR = path.join(GEMINI_DIR, "accounts");
var OAUTH_CREDS_FILE = "oauth_creds.json";
var CURRENT_PROFILE_FILE = ".current_profile";
var MAX_BACKUPS = 5;
var SAFE_PROFILE_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/;
function validateProfileName(profile) {
  const trimmed = profile.trim().toLowerCase();
  if (!SAFE_PROFILE_REGEX.test(trimmed)) {
    throw new Error(
      `Invalid profile name "${profile}". Must start with a letter, contain only letters, numbers, hyphens, underscores, and be 1-32 characters long.`
    );
  }
  const reserved = [".", "..", "con", "prn", "aux", "nul"];
  if (reserved.includes(trimmed)) {
    throw new Error(`Profile name "${profile}" is reserved.`);
  }
  return trimmed;
}
function getOauthCredsPath() {
  return path.join(GEMINI_DIR, OAUTH_CREDS_FILE);
}
function getProfileDir(profile) {
  const safe = validateProfileName(profile);
  return path.join(ACCOUNTS_DIR, safe);
}
function getProfileCredsPath(profile) {
  return path.join(getProfileDir(profile), OAUTH_CREDS_FILE);
}
function getCurrentProfilePath() {
  return path.join(ACCOUNTS_DIR, CURRENT_PROFILE_FILE);
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true, mode: 448 });
}
async function safeReadFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
async function secureWriteFile(filePath, content) {
  await fs.writeFile(filePath, content, { mode: 384 });
  try {
    await fs.chmod(filePath, 384);
  } catch {
  }
}
async function secureCopyFile(src, dest) {
  await fs.copyFile(src, dest);
  try {
    await fs.chmod(dest, 384);
  } catch {
  }
}
async function cleanupOldBackups() {
  try {
    const entries = await fs.readdir(GEMINI_DIR);
    const backups = entries.filter((e) => e.startsWith("oauth_creds.backup.") && e.endsWith(".json")).sort().reverse();
    for (const backup of backups.slice(MAX_BACKUPS)) {
      await fs.rm(path.join(GEMINI_DIR, backup), { force: true });
    }
  } catch {
  }
}

// src/profiles.ts
async function extractEmail(credsPath) {
  try {
    const content = await safeReadFile(credsPath);
    if (!content) return void 0;
    const data = JSON.parse(content);
    return data.email || data.id_token_claims?.email || void 0;
  } catch {
    return void 0;
  }
}
async function listProfiles() {
  const profiles = [];
  if (!await fileExists(ACCOUNTS_DIR)) {
    return { profiles: [], current: null };
  }
  const entries = await fs2.readdir(ACCOUNTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const profileCredsPath = path2.join(
      ACCOUNTS_DIR,
      entry.name,
      "oauth_creds.json"
    );
    if (!await fileExists(profileCredsPath)) continue;
    const stats = await fs2.stat(profileCredsPath);
    const email = await extractEmail(profileCredsPath);
    profiles.push({
      name: entry.name,
      createdAt: stats.mtime.toISOString(),
      email
    });
  }
  profiles.sort((a, b) => a.name.localeCompare(b.name));
  const currentContent = await safeReadFile(getCurrentProfilePath());
  const current = currentContent?.trim() || null;
  return { profiles, current };
}
async function saveProfile(profileName) {
  const profile = validateProfileName(profileName);
  const src = getOauthCredsPath();
  if (!await fileExists(src)) {
    throw new Error(
      `No OAuth credentials found at ${src}.
Please run "gemini" and complete "Login with Google" first.`
    );
  }
  const profileDir = getProfileDir(profile);
  await ensureDir(profileDir);
  const dest = getProfileCredsPath(profile);
  const isUpdate = await fileExists(dest);
  await secureCopyFile(src, dest);
  await secureWriteFile(getCurrentProfilePath(), profile);
  const action = isUpdate ? "Updated" : "Saved";
  const email = await extractEmail(dest);
  const emailInfo = email ? ` (${email})` : "";
  return `${action} profile "${profile}"${emailInfo}.`;
}
async function switchProfile(profileName) {
  const profile = validateProfileName(profileName);
  const src = getProfileCredsPath(profile);
  const dest = getOauthCredsPath();
  if (!await fileExists(src)) {
    const { profiles } = await listProfiles();
    const available = profiles.map((p) => p.name).join(", ") || "(none)";
    throw new Error(
      `Profile "${profile}" not found.
Available profiles: ${available}`
    );
  }
  if (await fileExists(dest)) {
    const timestamp = Date.now();
    const backupPath = path2.join(
      GEMINI_DIR,
      `oauth_creds.backup.${timestamp}.json`
    );
    await secureCopyFile(dest, backupPath);
    await cleanupOldBackups();
  }
  await secureCopyFile(src, dest);
  await secureWriteFile(getCurrentProfilePath(), profile);
  const email = await extractEmail(src);
  const emailInfo = email ? ` (${email})` : "";
  return `Switched to profile "${profile}"${emailInfo}.

\u26A0\uFE0F  Restart required: Type /quit then run 'gemini' again.`;
}
async function deleteProfile(profileName) {
  const profile = validateProfileName(profileName);
  const profileDir = getProfileDir(profile);
  if (!await fileExists(profileDir)) {
    throw new Error(`Profile "${profile}" does not exist.`);
  }
  const currentContent = await safeReadFile(getCurrentProfilePath());
  const isCurrent = currentContent?.trim() === profile;
  await fs2.rm(profileDir, { recursive: true, force: true });
  if (isCurrent) {
    await fs2.rm(getCurrentProfilePath(), { force: true });
  }
  let message = `Deleted profile "${profile}".`;
  if (isCurrent) {
    message += "\n\nNote: This was the active profile. Credentials remain until you switch or restart.";
  }
  return message;
}
async function getCurrentProfile() {
  const currentContent = await safeReadFile(getCurrentProfilePath());
  const current = currentContent?.trim();
  if (!current) {
    return "No profile is currently active.\n\nUse account_save tool to save your current session.";
  }
  const credsPath = getProfileCredsPath(current);
  if (!await fileExists(credsPath)) {
    return `Profile marker points to "${current}", but the profile no longer exists.`;
  }
  const email = await extractEmail(credsPath);
  const emailInfo = email ? ` (${email})` : "";
  return `Current profile: "${current}"${emailInfo}`;
}

// src/cli.ts
var colors = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  green: "\x1B[32m",
  red: "\x1B[31m",
  yellow: "\x1B[33m",
  cyan: "\x1B[36m"
};
function success(msg) {
  console.log(`${colors.green}\u2713${colors.reset} ${msg}`);
}
function error(msg) {
  console.error(`${colors.red}\u2717${colors.reset} ${msg}`);
}
function header(title) {
  console.log(`
${colors.cyan}${"\u2500".repeat(45)}${colors.reset}`);
  console.log(`${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${"\u2500".repeat(45)}${colors.reset}`);
}
async function cmdList() {
  const { profiles, current } = await listProfiles();
  header("SAVED PROFILES");
  if (profiles.length === 0) {
    console.log(`
  ${colors.dim}No saved profiles yet.${colors.reset}`);
    console.log(
      `  ${colors.dim}Use 'gemini-accounts save <name>' to save current session.${colors.reset}
`
    );
    return;
  }
  console.log();
  for (const p of profiles) {
    const marker = p.name === current ? `${colors.green}\u25CF active${colors.reset}` : "";
    const email = p.email ? `${colors.dim}(${p.email})${colors.reset}` : "";
    const name = p.name === current ? `${colors.green}${colors.bold}${p.name}${colors.reset}` : p.name;
    console.log(`  \u2022 ${name} ${email} ${marker}`);
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
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
async function cmdCurrent() {
  try {
    const result = await getCurrentProfile();
    console.log(result);
  } catch (err) {
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
${"\u2500".repeat(40)}
1. Run: ${colors.bold}/auth logout${colors.reset}
2. Run: ${colors.bold}/auth login${colors.reset} (choose a different Google account)
3. Run: ${colors.bold}gemini-accounts save <new-profile-name>${colors.reset}

${colors.dim}Example:${colors.reset}
  - You just saved "${profileName}"
  - After logging in with another account, save as "personal"
  - Then use: gemini-accounts switch ${profileName}
`);
  } catch (err) {
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
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
main();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini Account Switcher CLI
 * Simple command-line interface for managing OAuth profiles
 */
