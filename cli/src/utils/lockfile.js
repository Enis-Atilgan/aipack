import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';

const LOCKFILE_REL_PATH = join('.packai', 'lock.json');

/**
 * Read lockfile from target project directory.
 */
export function readLockfile(targetDir) {
  const lockPath = join(targetDir, LOCKFILE_REL_PATH);
  if (!existsSync(lockPath)) {
    return { lockfile_version: 1, packs: {} };
  }
  try {
    const raw = readFileSync(lockPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.packs ? parsed : { lockfile_version: 1, packs: {} };
  } catch {
    return { lockfile_version: 1, packs: {} };
  }
}

/**
 * Write lockfile to target project directory.
 */
export function writeLockfile(targetDir, lockData) {
  const packaiDir = join(targetDir, '.packai');
  if (!existsSync(packaiDir)) {
    mkdirSync(packaiDir, { recursive: true });
  }
  const lockPath = join(targetDir, LOCKFILE_REL_PATH);
  writeFileSync(lockPath, JSON.stringify(lockData, null, 2), 'utf-8');
}

/**
 * Record a pack application in the lockfile.
 */
export function recordPackApplied(targetDir, packMeta) {
  const lock = readLockfile(targetDir);
  lock.packs[packMeta.name] = {
    version: packMeta.version || '1.0.0',
    level: packMeta.level || 'simple',
    applied_at: new Date().toISOString(),
    target_client: packMeta.targetClient || 'all',
    files_created: Array.from(new Set(packMeta.filesCreated || [])),
    mcp_servers: packMeta.mcpServers || [],
    skills: packMeta.skills || []
  };
  writeLockfile(targetDir, lock);
  return lock;
}

/**
 * Record a pack removal and prune lockfile.
 */
export function recordPackRemoved(targetDir, packName) {
  const lock = readLockfile(targetDir);
  if (lock.packs[packName]) {
    delete lock.packs[packName];
  }

  const remaining = Object.keys(lock.packs).length;
  if (remaining === 0) {
    const lockPath = join(targetDir, LOCKFILE_REL_PATH);
    if (existsSync(lockPath)) {
      try { unlinkSync(lockPath); } catch {}
    }
  } else {
    writeLockfile(targetDir, lock);
  }
  return lock;
}

/**
 * Get all installed packs in target project directory.
 */
export function listInstalledPacks(targetDir) {
  const lock = readLockfile(targetDir);
  return Object.entries(lock.packs).map(([name, data]) => ({
    name,
    ...data
  }));
}
