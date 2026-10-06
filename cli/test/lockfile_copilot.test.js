import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { applyCommand } from '../src/commands/apply.js';
import { cleanCommand } from '../src/commands/clean.js';
import { listCommand } from '../src/commands/list.js';
import { readLockfile, listInstalledPacks } from '../src/utils/lockfile.js';

describe('PackAI Lockfile, List & GitHub Copilot Provisioning', () => {
  const tmpDir = join(os.tmpdir(), `packai-lock-test-${Date.now()}`);
  const targetDir = join(tmpDir, 'target-project');
  const packDir = join(tmpDir, 'mock-pack');

  before(() => {
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(targetDir, { recursive: true });
    mkdirSync(packDir, { recursive: true });

    const manifest = {
      spec_version: '2.0',
      name: 'lockfile-test-suite',
      version: '1.2.3',
      description: 'Test pack for lockfile and copilot tracking.',
      author: { name: 'gokboru' },
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead Dev', persona: { instructions: 'Build robust code.' } }
      ],
      tools: {
        mcp_servers: [
          { name: 'db-tool', command: 'npx', args: ['-y', 'db-mcp'] }
        ]
      }
    };

    writeFileSync(join(packDir, 'packai.yaml'), JSON.stringify(manifest, null, 2));
  });

  after(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test('applies pack, creates .packai/lock.json, and provisions GitHub Copilot', async () => {
    await applyCommand(packDir, { cwd: targetDir, target: 'all' });

    // 1. Verify GitHub Copilot instructions
    const copilotPath = join(targetDir, '.github', 'copilot-instructions.md');
    assert.equal(existsSync(copilotPath), true, 'GitHub Copilot instructions must be injected');

    // 2. Verify Lockfile creation
    const lockPath = join(targetDir, '.packai', 'lock.json');
    assert.equal(existsSync(lockPath), true, 'Lockfile .packai/lock.json must be created');

    const lock = readLockfile(targetDir);
    assert.ok(lock.packs['lockfile-test-suite'], 'Lockfile must record applied pack');
    assert.equal(lock.packs['lockfile-test-suite'].version, '1.2.3');
    assert.equal(lock.packs['lockfile-test-suite'].level, 'system');
    assert.ok(lock.packs['lockfile-test-suite'].files_created.includes('.github/copilot-instructions.md'));
    assert.ok(lock.packs['lockfile-test-suite'].files_created.includes('CLAUDE.md'));
    assert.ok(lock.packs['lockfile-test-suite'].mcp_servers.includes('db-tool'));

    // 3. Verify listInstalledPacks
    const installed = listInstalledPacks(targetDir);
    assert.equal(installed.length, 1);
    assert.equal(installed[0].name, 'lockfile-test-suite');

    // 4. Verify listCommand executes without error
    await listCommand(targetDir);
  });

  test('cleans pack, removes GitHub Copilot instructions, and updates lockfile', async () => {
    await cleanCommand(packDir, { cwd: targetDir, target: 'all' });

    // 1. Verify Copilot instructions cleaned
    const copilotPath = join(targetDir, '.github', 'copilot-instructions.md');
    assert.equal(existsSync(copilotPath), false, 'GitHub Copilot instructions should be cleaned');

    // 2. Verify Lockfile entry removed
    const lock = readLockfile(targetDir);
    assert.equal(lock.packs['lockfile-test-suite'], undefined, 'Pack must be removed from lockfile');

    const installed = listInstalledPacks(targetDir);
    assert.equal(installed.length, 0, 'No packs should remain installed');
  });
});
