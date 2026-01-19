/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ProfileInfo {
    name: string;
    createdAt: string;
    email?: string;
}
export interface ListResult {
    profiles: ProfileInfo[];
    current: string | null;
}
export declare function listProfiles(): Promise<ListResult>;
export declare function saveProfile(profileName: string): Promise<string>;
export declare function switchProfile(profileName: string): Promise<string>;
export declare function deleteProfile(profileName: string): Promise<string>;
export declare function getCurrentProfile(): Promise<string>;
