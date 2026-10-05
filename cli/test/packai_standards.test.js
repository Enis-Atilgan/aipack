import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';
import { initCommand } from '../src/commands/init.js';
import { packCommand } from '../src/commands/pack.js';
import { applyCommand } from '../src/commands/apply.js';
import { diffCommand, CLIENT_CAPABILITIES } from '../src/commands/diff.js';
import { loadManifest } from '../src/commands/validate.js';

describe('PackAI Standards-First Engine & Ingestion (05.10.2026 Spec)', () => {
  const tmpDir = join(os.tmpdir(), `packai-spec-test-${Date.now()}`);
  const mockWorkspace = join(tmpDir, 'mock-existing-project');
  const targetPack = join(tmpDir, 'extracted-pack');

  before(() => {
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(mockWorkspace, { recursive: true });

    // 1. Existing AGENTS.md
    writeFileSync(
      join(mockWorkspace, 'AGENTS.md'),
      '# Project Directives\n- Use clean architecture\n- Never leak secrets\n',
      'utf-8'
    );

    // 2. Existing Claude subagent (.claude/agents/backend.md)
    const claudeDir = join(mockWorkspace, '.claude', 'agents');
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, 'backend.md'),
      '---\nname: Backend Expert\ndescription: Handles server routes and db\ntools: Read, Bash, Edit\nmodel: smart\n---\n\nYou are a high-performance backend engineer.\n',
      'utf-8'
    );

    // 3. Existing Cursor modular rule (.cursor/rules/frontend.mdc)
    const cursorRulesDir = join(mockWorkspace, '.cursor', 'rules');
    mkdirSync(cursorRulesDir, { recursive: true });
    writeFileSync(
      join(cursorRulesDir, 'frontend.mdc'),
      '---\ndescription: Frontend UI builder\nglobs: ["src/ui/**"]\nalwaysApply: false\n---\n\nYou are a frontend Next.js expert.\n',
      'utf-8'
    );

    // 4. Existing MCP config (.cursor/mcp.json)
    const cursorDir = join(mockWorkspace, '.cursor');
    writeFileSync(
      join(cursorDir, 'mcp.json'),
      JSON.stringify({
        mcpServers: {
          database: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-postgres'],
            env: {
              DATABASE_URL: 'postgresql://localhost:5432/mydb'
            }
          }
        }
      }, null, 2),
      'utf-8'
    );

    // 5. Existing package.json
    writeFileSync(
      join(mockWorkspace, 'package.json'),
      JSON.stringify({ name: 'mock-app', version: '1.0.0' }, null, 2),
      'utf-8'
    );
  });

  after(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test('packai init --from-existing reverse engineers workspace into standards-first pack skeleton', async () => {
    await initCommand('extracted-pack', { fromExisting: mockWorkspace });

    const packPath = join(process.cwd(), 'extracted-pack');
    assert.equal(existsSync(packPath), true, 'Pack directory should exist');
    assert.equal(existsSync(join(packPath, 'packai.yaml')), true, 'packai.yaml should be created');
    assert.equal(existsSync(join(packPath, 'AGENTS.md')), true, 'AGENTS.md should be copied/created');
    assert.equal(existsSync(join(packPath, 'mcp.json')), true, 'mcp.json should be extracted');
    assert.equal(existsSync(join(packPath, 'agents', 'backend', 'system.md')), true, 'Backend agent prompt created');
    assert.equal(existsSync(join(packPath, 'agents', 'frontend', 'system.md')), true, 'Frontend agent prompt created');

    // Verify manifest contents
    const yamlRaw = readFileSync(join(packPath, 'packai.yaml'), 'utf-8');
    const parsed = YAML.parse(yamlRaw);

    assert.equal(parsed.level, 'system', 'Should detect multi-agent workforce and set system level');
    assert.equal(parsed.agents.length, 2, 'Should discover both backend and frontend agents');
    assert.equal(parsed.workflow.entry, 'backend', 'Entrypoint agent should be assigned');
    assert.equal(parsed.requirements.binaries.some(b => b.name === 'node'), true, 'Should detect node requirement');
    assert.equal(parsed.requirements.secrets.some(s => s.id === 'DATABASE_URL'), true, 'Should extract DATABASE_URL secret requirement');

    // Clean up
    rmSync(packPath, { recursive: true, force: true });
  });

  test('loadManifest parses packai.yaml and enriches companion AGENTS.md & mcp.json', async () => {
    const customPackDir = join(tmpDir, 'custom-yaml-pack');
    mkdirSync(customPackDir, { recursive: true });

    const yamlManifest = {
      spec_version: '2.0',
      name: 'yaml-test-pack',
      version: '1.0.0',
      description: 'Pack defined purely with packai.yaml and standards',
      author: { name: 'gokboru' },
      level: 'system',
      requirements: {
        platform: { os: ['darwin'], min_ram_gb: 8 },
        secrets: [{ id: 'API_KEY', required: true }]
      },
      workflow: {
        entry: 'coordinator'
      }
    };

    writeFileSync(join(customPackDir, 'packai.yaml'), YAML.stringify(yamlManifest), 'utf-8');
    writeFileSync(join(customPackDir, 'AGENTS.md'), '# Master Directives\nBe surgical.\n', 'utf-8');
    writeFileSync(join(customPackDir, 'mcp.json'), JSON.stringify({
      mcpServers: {
        github: { command: 'npx', args: ['@modelcontextprotocol/server-github'] }
      }
    }), 'utf-8');

    const loaded = loadManifest(customPackDir);
    assert.equal(loaded.isYaml, true, 'Should recognize YAML format');
    assert.equal(loaded.manifest.name, 'yaml-test-pack');
    assert.equal(loaded.manifest.rules.file, 'AGENTS.md', 'Companion AGENTS.md automatically wired as rules file');
    assert.equal(loaded.manifest.tools.mcp_servers.length, 1, 'Companion mcp.json automatically wired into tools.mcp_servers');
    assert.equal(loaded.manifest.tools.mcp_servers[0].id, 'github');
  });

  test('pack into .packai bundle archive and apply turnkey onto target project', async () => {
    const packSource = join(tmpDir, 'bundle-source');
    const targetProject = join(tmpDir, 'turnkey-project');
    mkdirSync(packSource, { recursive: true });
    mkdirSync(targetProject, { recursive: true });

    const packManifest = {
      spec_version: '2.0',
      name: 'turnkey-pack',
      version: '1.0.0',
      description: 'End-to-end turnkey bundle pack testing.',
      author: { name: 'gokboru' },
      level: 'system',
      agents: [
        { id: 'sentinel', name: 'Sentinel Analyst', persona: { instructions: 'Monitor threats.' } }
      ]
    };

    writeFileSync(join(packSource, 'packai.yaml'), YAML.stringify(packManifest), 'utf-8');
    writeFileSync(join(packSource, 'AGENTS.md'), '# Threat Directives\nStrict defense.\n', 'utf-8');

    const archiveOutput = join(tmpDir, 'turnkey-pack-1.0.0.packai');
    await packCommand(packSource, { output: archiveOutput });
    assert.equal(existsSync(archiveOutput), true, '.packai bundle archive should be created');

    // Apply from .packai archive
    await applyCommand(archiveOutput, { cwd: targetProject, target: 'all' });
    assert.equal(existsSync(join(targetProject, 'CLAUDE.md')), true, 'CLAUDE.md provisioned from .packai archive');
    assert.equal(existsSync(join(targetProject, 'AGENTS.md')), true, 'AGENTS.md provisioned from .packai archive');
    assert.equal(existsSync(join(targetProject, '.cursorrules')), true, '.cursorrules provisioned from .packai archive');
    assert.equal(existsSync(join(targetProject, '.claude', 'agents', 'sentinel.md')), true, 'Subagent provisioned from .packai archive');
  });

  test('diff command executes cleanly and displays client capability audit notices', async () => {
    const diffPack = join(tmpDir, 'diff-audit-pack');
    mkdirSync(diffPack, { recursive: true });

    const manifest = {
      spec_version: '2.0',
      name: 'diff-audit-pack',
      version: '1.0.0',
      description: 'Testing diff and capability notices.',
      author: { name: 'gokboru' },
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead', model_preference: 'smart' },
        { id: 'worker', name: 'Worker', model_preference: 'fast' }
      ],
      workflow: { entry: 'lead' },
      tools: {
        mcp_servers: [{ id: 'test-mcp', command: 'npx' }]
      }
    };

    writeFileSync(join(diffPack, 'packai.yaml'), YAML.stringify(manifest), 'utf-8');

    // Run diff against target
    await assert.doesNotReject(async () => {
      await diffCommand(diffPack, { cwd: tmpDir, target: 'cursor' });
    });
  });
});
