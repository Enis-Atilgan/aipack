import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';
import { initFromExisting } from '../src/commands/init.js';
import { applyCommand } from '../src/commands/apply.js';
import { cleanCommand } from '../src/commands/clean.js';
import { runCommand } from '../src/commands/run.js';
import { loadManifest } from '../src/commands/validate.js';

describe('Frameworks, Skills & Knowledge Ingestion Engine', () => {
  const testRoot = join(os.tmpdir(), `packai-framework-test-${Date.now()}`);
  const mockCrewProject = join(testRoot, 'mock-crew-project');
  const extractedPackDir = join(testRoot, 'extracted-crew-pack');
  const targetProjectDir = join(testRoot, 'target-project');

  before(() => {
    mkdirSync(mockCrewProject, { recursive: true });

    // 1. Mock CrewAI config/agents.yaml
    const crewConfigDir = join(mockCrewProject, 'config');
    mkdirSync(crewConfigDir, { recursive: true });
    writeFileSync(
      join(crewConfigDir, 'agents.yaml'),
      YAML.stringify({
        researcher: {
          role: 'Senior Cyber Threat Researcher',
          goal: 'Discover 0-day exploits and attack vectors',
          backstory: 'An elite red team analyst with decades of offensive security mastery.'
        },
        writer: {
          role: 'Technical Exploit Documenter',
          goal: 'Draft comprehensive exploit documentation',
          backstory: 'Specialist in documenting technical vulnerability reports.'
        }
      }),
      'utf-8'
    );
    writeFileSync(join(mockCrewProject, 'crew.py'), '# Mock CrewAI entrypoint\n', 'utf-8');

    // 2. Mock Roo-Code custom modes (.roomodes)
    writeFileSync(
      join(mockCrewProject, '.roomodes'),
      JSON.stringify(
        {
          customModes: [
            {
              slug: 'recon-agent',
              name: 'Reconnaissance Specialist',
              roleDefinition: 'Scans target perimeter and maps attack surface',
              groups: ['read', 'command'],
              customInstructions: 'Always perform non-destructive port scans.'
            }
          ]
        },
        null,
        2
      ),
      'utf-8'
    );

    // 3. Mock Agent Skills (skills/nmap-audit/SKILL.md)
    const skillDir = join(mockCrewProject, 'skills', 'nmap-audit');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '# Nmap Audit Skill\n\nRun network enumeration scripts with nmap.\n',
      'utf-8'
    );

    // 4. Mock Knowledge base (knowledge/threat_intel.md)
    const knowledgeDir = join(mockCrewProject, 'knowledge');
    mkdirSync(knowledgeDir, { recursive: true });
    writeFileSync(
      join(knowledgeDir, 'threat_intel.md'),
      '# Threat Intel Report\n\nAPT targets identified.\n',
      'utf-8'
    );

    // 5. Mock package and MCP
    writeFileSync(
      join(mockCrewProject, 'mcp.json'),
      JSON.stringify(
        {
          mcpServers: {
            shodan: { command: 'uvx', args: ['mcp-shodan'], env: { SHODAN_API_KEY: 'test-key' } }
          }
        },
        null,
        2
      ),
      'utf-8'
    );
  });

  after(() => {
    try {
      rmSync(testRoot, { recursive: true, force: true });
    } catch {}
  });

  it('init --from-existing ingests CrewAI, Roo-Code, Agent Skills, and Knowledge Base', async () => {
    await initFromExisting(mockCrewProject, extractedPackDir);

    assert.ok(existsSync(join(extractedPackDir, 'packai.yaml')), 'packai.yaml should exist');
    assert.ok(existsSync(join(extractedPackDir, 'AGENTS.md')), 'AGENTS.md should exist');
    assert.ok(existsSync(join(extractedPackDir, 'skills', 'nmap-audit', 'SKILL.md')), 'Skill should be copied to pack');
    assert.ok(existsSync(join(extractedPackDir, 'knowledge', 'threat_intel.md')), 'Knowledge should be copied to pack');

    const { manifest } = loadManifest(extractedPackDir);

    // Verify Agents discovered from CrewAI + Roo-Code
    assert.strictEqual(manifest.level, 'system');
    const agentIds = manifest.agents.map(a => a.id);
    assert.ok(agentIds.includes('researcher'), 'Should have researcher from CrewAI');
    assert.ok(agentIds.includes('writer'), 'Should have writer from CrewAI');
    assert.ok(agentIds.includes('recon-agent'), 'Should have recon-agent from Roo-Code');

    // Verify Execution command detected
    assert.ok(manifest.execution, 'Execution block should exist');
    assert.strictEqual(manifest.execution.command, 'python -m crewai run');

    // Verify Skills
    assert.ok(manifest.skills && manifest.skills.length === 1, 'Should register 1 skill');
    assert.strictEqual(manifest.skills[0].name, 'nmap-audit');

    // Verify Knowledge
    assert.ok(manifest.knowledge && manifest.knowledge.length === 1, 'Should register knowledge');
  });

  it('applyCommand provisions Agent Skills and Knowledge into target project', async () => {
    mkdirSync(targetProjectDir, { recursive: true });

    await applyCommand(extractedPackDir, { cwd: targetProjectDir, target: 'all', force: true });

    // Verify skills provisioned
    const targetSkillFile = join(targetProjectDir, 'skills', 'nmap-audit', 'SKILL.md');
    assert.ok(existsSync(targetSkillFile), 'Skill should be provisioned into target skills/ directory');

    // Verify knowledge provisioned
    const targetKnowledgeFile = join(targetProjectDir, '.packai', 'knowledge', 'threat_intel.md');
    assert.ok(existsSync(targetKnowledgeFile), 'Knowledge should be provisioned into .packai/knowledge/');

    // Verify subagents provisioned in .claude/agents/
    assert.ok(existsSync(join(targetProjectDir, '.claude', 'agents', 'researcher.md')), 'researcher subagent should be provisioned');
    assert.ok(existsSync(join(targetProjectDir, '.claude', 'agents', 'recon-agent.md')), 'recon-agent subagent should be provisioned');
  });

  it('cleanCommand safely removes provisioned skills and knowledge', async () => {
    await cleanCommand(extractedPackDir, { cwd: targetProjectDir, target: 'all', force: true });

    assert.ok(!existsSync(join(targetProjectDir, 'skills', 'nmap-audit')), 'Skill should be cleaned');
    assert.ok(!existsSync(join(targetProjectDir, '.packai', 'knowledge')), 'Knowledge should be cleaned');
    assert.ok(!existsSync(join(targetProjectDir, '.claude', 'agents', 'researcher.md')), 'researcher subagent should be cleaned');
  });

  it('runCommand executes command with pre-flight check', async () => {
    // Custom pack with node echo execution
    const runPackDir = join(testRoot, 'run-pack');
    mkdirSync(runPackDir, { recursive: true });
    writeFileSync(
      join(runPackDir, 'packai.yaml'),
      YAML.stringify({
        spec_version: '2.0',
        name: 'runner-pack',
        version: '1.0.0',
        description: 'Testing runner execution',
        author: { name: 'dev' },
        level: 'simple',
        execution: {
          command: 'node -e "process.exit(0)"'
        }
      }),
      'utf-8'
    );

    // Should not throw and exit cleanly
    await runCommand(runPackDir, { force: true });
  });
});
