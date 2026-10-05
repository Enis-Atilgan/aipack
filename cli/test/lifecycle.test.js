import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { initCommand } from '../src/commands/init.js';
import { applyCommand } from '../src/commands/apply.js';
import { cleanCommand } from '../src/commands/clean.js';

describe('End-to-End Pack Lifecycle (Init -> Apply -> Clean)', () => {
  const tmpDir = join(os.tmpdir(), `aipack-test-${Date.now()}`);
  const packDir = join(tmpDir, 'test-pack');
  const targetDir = join(tmpDir, 'target-project');

  let originalCwd;

  before(() => {
    originalCwd = process.cwd();
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(targetDir, { recursive: true });
    process.chdir(tmpDir);
  });

  after(() => {
    if (originalCwd) process.chdir(originalCwd);
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup
    }
  });

  test('scaffolds a system pack with initCommand', async () => {
    await initCommand('test-pack', { level: 'system', category: 'coding' });
    // init creates in current process directory, but let's verify files can be scaffolded
  });

  test('provisions and de-provisions cleanly with apply and clean', async () => {
    const mockManifest = {
      spec_version: '1.0',
      name: 'lifecycle-test-pack',
      version: '1.0.0',
      description: 'Pack for lifecycle testing.',
      author: { name: 'tester' },
      level: 'system',
      agents: [
        { id: 'worker', name: 'Worker Agent', persona: { instructions: 'Execute tasks.' } }
      ]
    };

    const mockPackPath = join(tmpDir, 'mock-pack');
    mkdirSync(mockPackPath, { recursive: true });
    const { writeFileSync } = await import('fs');
    writeFileSync(join(mockPackPath, 'manifest.json'), JSON.stringify(mockManifest, null, 2));

    // 1. Apply
    await applyCommand(mockPackPath, { cwd: targetDir, target: 'all' });

    assert.equal(existsSync(join(targetDir, 'CLAUDE.md')), true, 'CLAUDE.md should be injected');
    assert.equal(existsSync(join(targetDir, '.claude', 'agents', 'worker.md')), true, 'Worker subagent should be injected');
    assert.equal(existsSync(join(targetDir, '.cursorrules')), true, '.cursorrules should be injected');

    // 2. Clean
    await cleanCommand(mockPackPath, { cwd: targetDir, target: 'all' });

    assert.equal(existsSync(join(targetDir, 'CLAUDE.md')), false, 'CLAUDE.md should be cleaned');
    assert.equal(existsSync(join(targetDir, '.claude', 'agents', 'worker.md')), false, 'Worker subagent should be cleaned');
    assert.equal(existsSync(join(targetDir, '.cursorrules')), false, '.cursorrules should be cleaned');
  });
});
