import { execSync } from 'child_process';
import os from 'os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const AIPACK_HOME = join(os.homedir(), '.aipack');
const CREDENTIALS_FILE = join(AIPACK_HOME, 'credentials.json');

function ensureConfigDir() {
  if (!existsSync(AIPACK_HOME)) {
    mkdirSync(AIPACK_HOME, { recursive: true });
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

  // 2. macOS native Keychain service
  if (os.platform() === 'darwin') {
    try {
      const output = execSync(
        `security find-generic-password -s "aipack" -a "${key}" -w`,
        { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
      );
      if (output.trim()) return output.trim();
    } catch {
      // Not found in Keychain
    }
  }

  // 3. Fallback: ~/.aipack/credentials.json
  if (existsSync(CREDENTIALS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
      if (data[key]) return data[key];
    } catch {
      // Parse error
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
      // Delete existing if any, then add
      try {
        execSync(`security delete-generic-password -s "aipack" -a "${key}"`, { stdio: 'ignore' });
      } catch {
        // Did not exist
      }
      execSync(
        `security add-generic-password -s "aipack" -a "${key}" -w "${value}" -U`,
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
