import { execSync } from 'child_process';
import os from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PACKAI_HOME = join(os.homedir(), '.packai');
const LEGACY_AIPACK_HOME = join(os.homedir(), '.aipack');
const CREDENTIALS_FILE = join(PACKAI_HOME, 'credentials.json');
const LEGACY_CREDENTIALS_FILE = join(LEGACY_AIPACK_HOME, 'credentials.json');

function ensureConfigDir() {
  if (!existsSync(PACKAI_HOME)) {
    mkdirSync(PACKAI_HOME, { recursive: true });
  }
}

/**
 * Retrieve a credential from Environment, OS Keychain (macOS), or local store.
 */
export function getCredential(key) {
  // 1. Process environment variable has first priority
  if (process.env[key]) {
    return process.env[key];
  }

  // 2. macOS native Keychain service (try 'packai' first, then 'aipack')
  if (os.platform() === 'darwin') {
    for (const service of ['packai', 'aipack']) {
      try {
        const output = execSync(
          `security find-generic-password -s "${service}" -a "${key}" -w`,
          { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
        );
        if (output && output.trim()) return output.trim();
      } catch {
        // Not found in this service
      }
    }
  }

  // 3. Fallback: ~/.packai/credentials.json, then ~/.aipack/credentials.json
  for (const file of [CREDENTIALS_FILE, LEGACY_CREDENTIALS_FILE]) {
    if (existsSync(file)) {
      try {
        const data = JSON.parse(readFileSync(file, 'utf-8'));
        if (data[key]) return data[key];
      } catch {
        // Parse error
      }
    }
  }

  return null;
}

/**
 * Store a credential safely in OS Keychain or local config.
 */
export function setCredential(key, value) {
  ensureConfigDir();

  // 1. Try macOS Keychain
  if (os.platform() === 'darwin') {
    try {
      try {
        execSync(`security delete-generic-password -s "packai" -a "${key}"`, { stdio: 'ignore' });
      } catch {
        // Did not exist
      }
      execSync(
        `security add-generic-password -s "packai" -a "${key}" -w "${value}" -U`,
        { stdio: 'ignore' }
      );
      return true;
    } catch {
      // Fall through to file store if keychain fails
    }
  }

  // 2. Local config store (chmod 600)
  let data = {};
  if (existsSync(CREDENTIALS_FILE)) {
    try {
      data = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
    } catch {
      data = {};
    }
  }
  data[key] = value;
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  return true;
}
