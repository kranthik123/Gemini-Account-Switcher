/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs/promises";
import path from "node:path";

import {
    ACCOUNTS_DIR,
    GEMINI_DIR,
    fileExists,
    ensureDir,
    getOauthCredsPath,
    getProfileDir,
    getProfileCredsPath,
    getCurrentProfilePath,
    validateProfileName,
    secureCopyFile,
    secureWriteFile,
    safeReadFile,
    cleanupOldBackups,
} from "./utils.js";

export interface ProfileInfo {
    name: string;
    createdAt: string;
    email?: string;
}

export interface ListResult {
    profiles: ProfileInfo[];
    current: string | null;
}

// Extract email from OAuth creds if possible
async function extractEmail(credsPath: string): Promise<string | undefined> {
    try {
        const content = await safeReadFile(credsPath);
        if (!content) return undefined;

        const data = JSON.parse(content);
        return data.email || data.id_token_claims?.email || undefined;
    } catch {
        return undefined;
    }
}

export async function listProfiles(): Promise<ListResult> {
    const profiles: ProfileInfo[] = [];

    if (!(await fileExists(ACCOUNTS_DIR))) {
        return { profiles: [], current: null };
    }

    const entries = await fs.readdir(ACCOUNTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const profileCredsPath = path.join(
            ACCOUNTS_DIR,
            entry.name,
            "oauth_creds.json"
        );
        if (!(await fileExists(profileCredsPath))) continue;

        const stats = await fs.stat(profileCredsPath);
        const email = await extractEmail(profileCredsPath);

        profiles.push({
            name: entry.name,
            createdAt: stats.mtime.toISOString(),
            email,
        });
    }

    profiles.sort((a, b) => a.name.localeCompare(b.name));

    const currentContent = await safeReadFile(getCurrentProfilePath());
    const current = currentContent?.trim() || null;

    return { profiles, current };
}

export async function saveProfile(profileName: string): Promise<string> {
    const profile = validateProfileName(profileName);
    const src = getOauthCredsPath();

    if (!(await fileExists(src))) {
        throw new Error(
            `No OAuth credentials found at ${src}.\n` +
            `Please run "gemini" and complete "Login with Google" first.`
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

export async function switchProfile(profileName: string): Promise<string> {
    const profile = validateProfileName(profileName);
    const src = getProfileCredsPath(profile);
    const dest = getOauthCredsPath();

    if (!(await fileExists(src))) {
        const { profiles } = await listProfiles();
        const available = profiles.map((p) => p.name).join(", ") || "(none)";
        throw new Error(
            `Profile "${profile}" not found.\nAvailable profiles: ${available}`
        );
    }

    // Backup current credentials
    if (await fileExists(dest)) {
        const timestamp = Date.now();
        const backupPath = path.join(
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

    return `Switched to profile "${profile}"${emailInfo}.\n\n⚠️  Restart required: Type /quit then run 'gemini' again.`;
}

export async function deleteProfile(profileName: string): Promise<string> {
    const profile = validateProfileName(profileName);
    const profileDir = getProfileDir(profile);

    if (!(await fileExists(profileDir))) {
        throw new Error(`Profile "${profile}" does not exist.`);
    }

    const currentContent = await safeReadFile(getCurrentProfilePath());
    const isCurrent = currentContent?.trim() === profile;

    await fs.rm(profileDir, { recursive: true, force: true });

    if (isCurrent) {
        await fs.rm(getCurrentProfilePath(), { force: true });
    }

    let message = `Deleted profile "${profile}".`;
    if (isCurrent) {
        message +=
            "\n\nNote: This was the active profile. Credentials remain until you switch or restart.";
    }

    return message;
}

export async function getCurrentProfile(): Promise<string> {
    const currentContent = await safeReadFile(getCurrentProfilePath());
    const current = currentContent?.trim();

    if (!current) {
        return "No profile is currently active.\n\nUse account_save tool to save your current session.";
    }

    const credsPath = getProfileCredsPath(current);
    if (!(await fileExists(credsPath))) {
        return `Profile marker points to "${current}", but the profile no longer exists.`;
    }

    const email = await extractEmail(credsPath);
    const emailInfo = email ? ` (${email})` : "";

    return `Current profile: "${current}"${emailInfo}`;
}
