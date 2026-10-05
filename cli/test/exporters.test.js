import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { exportToClaude } from '../src/exporters/claude.js';
import { exportToCursor } from '../src/exporters/cursor.js';
import { exportToChatGPT } from '../src/exporters/chatgpt.js';

describe('Format Exporters (Claude, Cursor, ChatGPT)', () => {
  const sampleManifest = {
    name: 'security-auditor',
    version: '1.2.0',
    description: 'Autonomous security auditor agent.',
    level: 'enhanced',
    persona: {
      role: 'AppSec Engineer',
      tone: 'critical and precise',
      expertise: ['OWASP Top 10', 'Code Review']
    },
    rules: {
      items: ['Never output vulnerable code without warning', 'Always specify CWE numbers']
    }
  };

  test('exportToClaude generates valid CLAUDE.md structure', () => {
    const result = exportToClaude(sampleManifest, '.');
    assert.ok(result.includes('# CLAUDE.md'));
    assert.ok(result.includes('security-auditor'));
    assert.ok(result.includes('AppSec Engineer'));
    assert.ok(result.includes('Always specify CWE numbers'));
  });

  test('exportToCursor generates valid .cursorrules structure', () => {
    const result = exportToCursor(sampleManifest, '.');
    assert.ok(result.includes('AI Rules for security-auditor'));
    assert.ok(result.includes('## Persona'));
    assert.ok(result.includes('## Rules'));
    assert.ok(result.includes('Never output vulnerable code without warning'));
  });

  test('exportToChatGPT generates concise custom instructions', () => {
    const result = exportToChatGPT(sampleManifest, '.');
    assert.ok(result.length > 0);
    assert.ok(result.length <= 1500, 'ChatGPT instructions should not exceed character limits');
    assert.ok(result.includes('AppSec Engineer'));
    assert.ok(result.includes('Rules:'));
  });

  test('exportToClaude and exportToCursor export Level 3 multi-agent workforce and routing tables', () => {
    const systemManifest = {
      spec_version: '1.0',
      name: 'redteam-system',
      version: '2.0.0',
      description: 'Level 3 autonomous red team.',
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead Architect', model_preference: 'smart', persona: { instructions: 'Coordinate attack.' } },
        { id: 'recon', name: 'Recon Specialist', model_preference: 'fast', persona: { instructions: 'Scan ports.' } }
      ],
      workflow: {
        entry: 'lead',
        shared_context: { max_history_messages: 25 },
        routes: [
          { from: 'lead', to: 'recon', condition: 'target_specified' }
        ]
      }
    };

    const claudeResult = exportToClaude(systemManifest, '.');
    assert.ok(claudeResult.includes('Multi-Agent Workforce (Level 3 System)'));
    assert.ok(claudeResult.includes('Lead Architect'));
    assert.ok(claudeResult.includes('Routing Decision Table'));
    assert.ok(claudeResult.includes('target_specified'));

    const cursorResult = exportToCursor(systemManifest, '.');
    assert.ok(cursorResult.includes('Multi-Agent Workforce (Level 3)'));
    assert.ok(cursorResult.includes('Task Routing Logic'));
    assert.ok(cursorResult.includes('Route from `lead` to `recon`'));
  });

  test('exportToAgentsMd generates AAIF compliant universal markdown', async () => {
    const { exportToAgentsMd } = await import('../src/exporters/agentsmd.js');
    const result = exportToAgentsMd(sampleManifest, '.');
    assert.ok(result.includes('# AGENTS.md'));
    assert.ok(result.includes('Linux Foundation AAIF Specification'));
    assert.ok(result.includes('AppSec Engineer'));
    assert.ok(result.includes('Always specify CWE numbers'));
  });

  test('exportToWindsurf generates valid Cascade rules', async () => {
    const { exportToWindsurf } = await import('../src/exporters/windsurf.js');
    const result = exportToWindsurf(sampleManifest, '.');
    assert.ok(result.includes('Windsurf Cascade Rules'));
    assert.ok(result.includes('AppSec Engineer'));
  });

  test('exportToRooModes generates valid .roomodes JSON configuration', async () => {
    const { exportToRooModes } = await import('../src/exporters/roomodes.js');
    const result = exportToRooModes(sampleManifest, '.');
    const parsed = JSON.parse(result);
    assert.ok(Array.isArray(parsed.customModes));
    assert.equal(parsed.customModes[0].slug, 'security-auditor');
    assert.ok(parsed.customModes[0].groups.includes('command'));
  });

  test('exportClaudePlugin generates official .claude-plugin/plugin.json and subagents', async () => {
    const { exportClaudePlugin } = await import('../src/exporters/plugins.js');
    const { join } = await import('path');
    const { existsSync, readFileSync, rmSync, mkdirSync } = await import('fs');
    const os = (await import('os')).default;

    const tmpOut = join(os.tmpdir(), `claude-plugin-test-${Date.now()}`);
    mkdirSync(tmpOut, { recursive: true });

    const systemManifest = {
      name: 'redteam-plugin',
      version: '1.0.0',
      description: 'Official Claude Code Red Team plugin bundle',
      author: { name: 'gokboru' },
      level: 'system',
      agents: [
        { id: 'recon', name: 'Recon', model_preference: 'fast', tools: ['Read', 'Bash'], persona: { instructions: 'Find ports.' } }
      ],
      tools: {
        mcp_servers: [{ id: 'nmap', command: 'npx' }]
      }
    };

    const res = exportClaudePlugin(systemManifest, '.', tmpOut);
    assert.equal(res.target, 'claude-plugin');
    assert.ok(existsSync(join(tmpOut, '.claude-plugin', 'plugin.json')));
    assert.ok(existsSync(join(tmpOut, 'CLAUDE.md')));
    assert.ok(existsSync(join(tmpOut, 'agents', 'recon.md')));
    assert.ok(existsSync(join(tmpOut, '.mcp.json')));

    const manifestJson = JSON.parse(readFileSync(join(tmpOut, '.claude-plugin', 'plugin.json'), 'utf-8'));
    assert.equal(manifestJson.name, 'redteam-plugin');

    rmSync(tmpOut, { recursive: true, force: true });
  });

  test('exportCursorPlugin generates official .cursor-plugin/plugin.json and modular rules', async () => {
    const { exportCursorPlugin } = await import('../src/exporters/plugins.js');
    const { join } = await import('path');
    const { existsSync, readFileSync, rmSync, mkdirSync } = await import('fs');
    const os = (await import('os')).default;

    const tmpOut = join(os.tmpdir(), `cursor-plugin-test-${Date.now()}`);
    mkdirSync(tmpOut, { recursive: true });

    const systemManifest = {
      name: 'cursor-pentest-plugin',
      version: '1.0.0',
      description: 'Official Cursor plugin bundle',
      author: { name: 'gokboru' },
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead', model_preference: 'smart', persona: { instructions: 'Coordinate.' } }
      ]
    };

    const res = exportCursorPlugin(systemManifest, '.', tmpOut);
    assert.equal(res.target, 'cursor-plugin');
    assert.ok(existsSync(join(tmpOut, '.cursor-plugin', 'plugin.json')));
    assert.ok(existsSync(join(tmpOut, '.cursorrules')));
    assert.ok(existsSync(join(tmpOut, 'rules', 'lead.mdc')));

    rmSync(tmpOut, { recursive: true, force: true });
  });

  test('exportCodexPlugin generates ai-plugin.json and AGENTS.md', async () => {
    const { exportCodexPlugin } = await import('../src/exporters/plugins.js');
    const { join } = await import('path');
    const { existsSync, readFileSync, rmSync, mkdirSync } = await import('fs');
    const os = (await import('os')).default;

    const tmpOut = join(os.tmpdir(), `codex-plugin-test-${Date.now()}`);
    mkdirSync(tmpOut, { recursive: true });

    const manifest = {
      name: 'codex-pentest-plugin',
      version: '1.0.0',
      description: 'OpenAI Codex compatible plugin bundle',
      author: { name: 'gokboru' },
      level: 'simple'
    };

    const res = exportCodexPlugin(manifest, '.', tmpOut);
    assert.equal(res.target, 'codex-plugin');
    assert.ok(existsSync(join(tmpOut, 'ai-plugin.json')));
    assert.ok(existsSync(join(tmpOut, 'AGENTS.md')));

    rmSync(tmpOut, { recursive: true, force: true });
  });
});
