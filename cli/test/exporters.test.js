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
});
