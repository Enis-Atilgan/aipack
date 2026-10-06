import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest, runSemanticChecks } from '../src/commands/validate.js';

describe('Manifest Validation & Semantic Checks', () => {
  test('validates a valid simple pack manifest', () => {
    const manifest = {
      spec_version: '1.0',
      name: 'simple-go-rules',
      version: '1.0.0',
      description: 'Idiomatic Go conventions and guidelines.',
      author: { name: 'hatred' },
      level: 'simple',
      persona: { role: 'Go Engineer', tone: 'concise' },
      rules: { items: ['Always handle errors explicitly', 'Use table-driven tests'] }
    };

    const result = validateManifest(manifest);
    assert.equal(result.valid, true, `Errors: ${JSON.stringify(result.errors)}`);
  });

  test('validates a valid system pack with universal requirements and workflow', () => {
    const manifest = {
      spec_version: '1.0',
      name: 'autonomous-pentest-team',
      version: '1.0.0',
      description: 'Multi-agent autonomous penetration testing team.',
      author: { name: 'hatred' },
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead', model_preference: 'smart' },
        { id: 'recon', name: 'Recon', model_preference: 'fast' }
      ],
      workflow: {
        entry: 'lead',
        routes: [
          { from: 'lead', to: 'recon', condition: 'intent == recon' }
        ]
      },
      requirements: {
        platform: { os: ['darwin', 'linux'], min_ram_gb: 8 },
        binaries: [
          { name: 'nmap', install: { brew: 'brew install nmap' } }
        ],
        secrets: [
          { id: 'OPENAI_API_KEY', required: true }
        ]
      }
    };

    const result = validateManifest(manifest);
    assert.equal(result.valid, true, `Errors: ${JSON.stringify(result.errors)}`);
  });

  test('rejects invalid pack names (uppercase, invalid symbols)', () => {
    const manifest = {
      spec_version: '1.0',
      name: 'Invalid_Name_123!',
      version: '1.0.0',
      description: 'Test invalid naming conventions.',
      author: { name: 'hatred' },
      level: 'simple'
    };

    const result = validateManifest(manifest);
    assert.equal(result.valid, false);
  });

  test('rejects invalid semantic version', () => {
    const manifest = {
      spec_version: '1.0',
      name: 'test-pack',
      version: 'v1.0-beta', // invalid semver pattern
      description: 'Test semver validation check.',
      author: { name: 'hatred' },
      level: 'simple'
    };

    const result = validateManifest(manifest);
    assert.equal(result.valid, false);
  });

  test('detects level inconsistencies in semantic checks', () => {
    const manifest = {
      spec_version: '1.0',
      name: 'inconsistent-pack',
      version: '1.0.0',
      description: 'Declared as system but has no agents.',
      author: { name: 'hatred' },
      level: 'system',
      agents: []
    };

    const { errors } = runSemanticChecks(manifest, '.');
    assert.ok(errors.some(e => e.includes('no agents are defined')));
  });

  test('detects missing execution entrypoint in semantic checks', () => {
    const manifest = {
      spec_version: '2.0',
      name: 'runner-pack',
      version: '1.0.0',
      description: 'Pack with missing entrypoint file.',
      author: { name: 'hatred' },
      level: 'simple',
      execution: {
        command: 'python3',
        entrypoint: 'missing_runner.py'
      }
    };

    const { errors } = runSemanticChecks(manifest, '/tmp');
    assert.ok(errors.some(e => e.includes('Execution entrypoint not found: missing_runner.py')));
  });
});
