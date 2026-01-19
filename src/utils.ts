/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Constants
export const GEMINI_DIR = path.join(os.homedir(), ".gemini");
export const ACCOUNTS_DIR = path.join(GEMINI_DIR, "accounts");
export const OAUTH_CREDS_FILE = "oauth_creds.json";
export const CURRENT_PROFILE_FILE = ".current_profile";
export const MAX_BACKUPS = 5;

// Strict profile name validation (prevent path traversal)
const SAFE_PROFILE_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/;

export function validateProfileName(profile: string): string {
    const trimmed = profile.trim().toLowerCase();

    if (!SAFE_PROFILE_REGEX.test(trimmed)) {
        throw new Error(
            `Invalid profile name "${profile}". ` +
            `Must start with a letter, contain only letters, numbers, hyphens, underscores, ` +
            `and be 1-32 characters long.`
        );
    }

    // Extra safety: block reserved names
    const reserved = [".", "..", "con", "prn", "aux", "nul"];
    if (reserved.includes(trimmed)) {
        throw new Error(`Profile name "${profile}" is reserved.`);
    }

    return trimmed;
}

export function getOauthCredsPath(): string {
    return path.join(GEMINI_DIR, OAUTH_CREDS_FILE);
}

export function getProfileDir(profile: string): string {
    const safe = validateProfileName(profile);
    return path.join(ACCOUNTS_DIR, safe);
}

export function getProfileCredsPath(profile: string): string {
    return path.join(getProfileDir(profile), OAUTH_CREDS_FILE);
}

export function getCurrentProfilePath(): string {
    return path.join(ACCOUNTS_DIR, CURRENT_PROFILE_FILE);
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
}

export async function safeReadFile(filePath: string): Promise<string | null> {
    try {
        return await fs.readFile(filePath, "utf-8");
    } catch {
        return null;
    }
}

export async function secureWriteFile(
    filePath: string,
    content: string
): Promise<void> {
    await fs.writeFile(filePath, content, { mode: 0o600 });
    try {
        await fs.chmod(filePath, 0o600);
    } catch {
        // chmod may fail on Windows - ignore as it's not critical there
    }
}

export async function secureCopyFile(
    src: string,
    dest: string
): Promise<void> {
    await fs.copyFile(src, dest);
    try {
        await fs.chmod(dest, 0o600);
    } catch {
        // chmod may fail on Windows - ignore as it's not critical there
    }
}

// Cleanup old backups, keeping only MAX_BACKUPS most recent
export async function cleanupOldBackups(): Promise<void> {
    try {
        const entries = await fs.readdir(GEMINI_DIR);
        const backups = entries
            .filter((e) => e.startsWith("oauth_creds.backup.") && e.endsWith(".json"))
            .sort()
            .reverse();

        // Remove backups beyond MAX_BACKUPS
        for (const backup of backups.slice(MAX_BACKUPS)) {
            await fs.rm(path.join(GEMINI_DIR, backup), { force: true });
        }
    } catch {
        // Ignore cleanup errors
    }
}
