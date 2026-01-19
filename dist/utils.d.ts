/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const GEMINI_DIR: string;
export declare const ACCOUNTS_DIR: string;
export declare const OAUTH_CREDS_FILE = "oauth_creds.json";
export declare const CURRENT_PROFILE_FILE = ".current_profile";
export declare const MAX_BACKUPS = 5;
export declare function validateProfileName(profile: string): string;
export declare function getOauthCredsPath(): string;
export declare function getProfileDir(profile: string): string;
export declare function getProfileCredsPath(profile: string): string;
export declare function getCurrentProfilePath(): string;
export declare function fileExists(filePath: string): Promise<boolean>;
export declare function ensureDir(dirPath: string): Promise<void>;
export declare function safeReadFile(filePath: string): Promise<string | null>;
export declare function secureWriteFile(filePath: string, content: string): Promise<void>;
export declare function secureCopyFile(src: string, dest: string): Promise<void>;
export declare function cleanupOldBackups(): Promise<void>;
