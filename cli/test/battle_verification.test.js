import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import YAML from 'yaml';
import { initFromExisting } from '../src/commands/init.js';
import { packCommand } from '../src/commands/pack.js';
import { applyCommand } from '../src/commands/apply.js';
import { cleanCommand } from '../src/commands/clean.js';
import { runCommand } from '../src/commands/run.js';
import { validateManifest, runSemanticChecks, loadManifest } from '../src/commands/validate.js';
import { exportAllPlugins } from '../src/exporters/plugins.js';
import { setCredential } from '../src/utils/credentials.js';

describe('BATTLE VERIFICATION: Universal Multi-Agent & Framework Invariance', () => {
  const rootDir = join(os.tmpdir(), `packai-battle-${Date.now()}`);
  const whiteBoxSource = join(rootDir, 'whitebox-source');
  const whiteBoxPackDir = join(rootDir, 'whitebox-pack');
  const whiteBoxTarget = join(rootDir, 'whitebox-target');

  const blackBoxSource = join(rootDir, 'blackbox-source');
  const blackBoxTarget = join(rootDir, 'blackbox-target');

  const exportDistDir = join(rootDir, 'dist-plugins');

  before(() => {
    mkdirSync(rootDir, { recursive: true });

    // ─── 1. Setup White-Box Source (Complex IDE Multi-Agent Setup) ───
    mkdirSync(whiteBoxSource, { recursive: true });

    // Standard AAIF AGENTS.md
    writeFileSync(
      join(whiteBoxSource, 'AGENTS.md'),
      '# Cyber Mesh Protocol\n\nDirectives for all autonomous security agents.\n',
      'utf-8'
    );

    // Claude Code Subagents
    const claudeAgentsDir = join(whiteBoxSource, '.claude', 'agents');
    mkdirSync(claudeAgentsDir, { recursive: true });
    writeFileSync(
      join(claudeAgentsDir, 'scanner.md'),
      '---\nname: scanner\ndescription: Port & vuln scanner\nmodel: smart\ntools: Read, Bash\n---\n# Scanner Persona\nYou discover open ports.\n',
      'utf-8'
    );

    // Cursor modular rule
    const cursorRulesDir = join(whiteBoxSource, '.cursor', 'rules');
    mkdirSync(cursorRulesDir, { recursive: true });
    writeFileSync(
      join(cursorRulesDir, 'exploiter.mdc'),
      '---\ndescription: Exploit payload crafter\nglobs: "**/*.py"\nalwaysApply: false\n---\n# Exploiter Agent\nYou craft PoC payloads.\n',
      'utf-8'
    );

    // Agent Skills
    const skillDir = join(whiteBoxSource, 'skills', 'shodan-intel');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '# Shodan Intel Skill\nQueries Shodan API for exposed assets.\n',
      'utf-8'
    );

    // Knowledge
    const knowDir = join(whiteBoxSource, 'knowledge');
    mkdirSync(knowDir, { recursive: true });
    writeFileSync(
      join(knowDir, 'network_topology.md'),
      '# Target Topology\nSubnet 10.0.0.0/24\n',
      'utf-8'
    );

    // MCP
    writeFileSync(
      join(whiteBoxSource, 'mcp.json'),
      JSON.stringify(
        {
          mcpServers: {
            nmap_mcp: {
              command: 'uvx',
              args: ['nmap-mcp-server'],
              env: { SCAN_TIMEOUT: '30s' }
            }
          }
        },
        null,
        2
      ),
      'utf-8'
    );

    // ─── 2. Setup Black-Box Source (Bespoke Custom Python Swarm System) ───
    mkdirSync(blackBoxSource, { recursive: true });

    // Custom python script simulating an exotic multi-agent engine
    writeFileSync(
      join(blackBoxSource, 'swarm_engine.py'),
      `import os, sys
token = os.environ.get("EXOTIC_SWARM_SECRET")
if not token:
    print("FATAL: EXOTIC_SWARM_SECRET not found in env")
    sys.exit(1)
print(f"SUCCESS: Swarm engine initialized with secret length {len(token)}")
sys.exit(0)
`,
      'utf-8'
    );

    // The manifest that wraps this black-box system
    writeFileSync(
      join(blackBoxSource, 'packai.yaml'),
      YAML.stringify({
        spec_version: '2.0',
        name: 'exotic-swarm-engine',
        version: '1.0.0',
        description: 'Exotic bespoke swarm multi-agent engine written in custom Python',
        author: { name: 'researcher', github: 'researcher' },
        level: 'system',
        category: 'security',
        requirements: {
          platform: { os: ['darwin', 'linux'], min_ram_gb: 4 },
          binaries: [{ name: 'python3' }],
          secrets: [{ id: 'EXOTIC_SWARM_SECRET', label: 'Swarm Master Secret', required: true }]
        },
        execution: {
          command: 'python3 swarm_engine.py'
        },
        agents: [
          {
            id: 'swarm-coordinator',
            name: 'Swarm Coordinator',
            description: 'Coordinates nodes',
            persona: { instructions: 'Coordinate all worker nodes' }
          }
        ],
        workflow: {
          entry: 'swarm-coordinator',
          routes: [{ from: 'swarm-coordinator', to: 'swarm-coordinator', condition: 'default', fallback: true }]
        }
      }),
      'utf-8'
    );
  });

  after(() => {
    try {
      rmSync(rootDir, { recursive: true, force: true });
    } catch {}
  });

  it('SCENARIO 1 (WHITE-BOX): Ingests, Validates, Packs, Provisions, and De-provisions cleanly', async () => {
    // 1. Ingest workspace via init --from-existing
    await initFromExisting(whiteBoxSource, whiteBoxPackDir);

    assert.ok(existsSync(join(whiteBoxPackDir, 'packai.yaml')), 'packai.yaml must be generated');
    assert.ok(existsSync(join(whiteBoxPackDir, 'skills', 'shodan-intel', 'SKILL.md')), 'Skill must be ingested');
    assert.ok(existsSync(join(whiteBoxPackDir, 'knowledge', 'network_topology.md')), 'Knowledge must be ingested');

    const { manifest } = loadManifest(whiteBoxPackDir);
    assert.strictEqual(manifest.level, 'system');
    const agentIds = manifest.agents.map(a => a.id);
    assert.ok(agentIds.includes('scanner'), 'Scanner agent ingested from Claude');
    assert.ok(agentIds.includes('exploiter'), 'Exploiter agent ingested from Cursor');

    // 2. Validate manifest schema and semantics
    const val = validateManifest(manifest);
    assert.ok(val.valid, `Manifest schema must be valid: ${JSON.stringify(val.errors)}`);
    const sem = runSemanticChecks(manifest, whiteBoxPackDir);
    assert.strictEqual(sem.errors.length, 0, `Semantic errors must be 0: ${JSON.stringify(sem.errors)}`);

    // 3. Pack into .packai bundle archive
    const archivePath = join(rootDir, 'whitebox.packai');
    await packCommand(whiteBoxPackDir, { output: archivePath });
    assert.ok(existsSync(archivePath), '.packai bundle archive must exist');

    // 4. Provision from archive into clean target
    mkdirSync(whiteBoxTarget, { recursive: true });
    await applyCommand(archivePath, { cwd: whiteBoxTarget, target: 'all', force: true });

    // Verify all targets got provisioned
    assert.ok(existsSync(join(whiteBoxTarget, 'CLAUDE.md')), 'CLAUDE.md provisioned');
    assert.ok(existsSync(join(whiteBoxTarget, '.claude', 'agents', 'scanner.md')), 'Claude subagent provisioned');
    assert.ok(existsSync(join(whiteBoxTarget, '.cursorrules')), '.cursorrules provisioned');
    assert.ok(existsSync(join(whiteBoxTarget, '.cursor', 'rules', 'exploiter.mdc')), 'Cursor modular rule provisioned');
    assert.ok(existsSync(join(whiteBoxTarget, 'skills', 'shodan-intel', 'SKILL.md')), 'Agent Skill provisioned');
    assert.ok(existsSync(join(whiteBoxTarget, '.packai', 'knowledge', 'network_topology.md')), 'Knowledge provisioned');

    // 5. Clean provisioned assets
    await cleanCommand(archivePath, { cwd: whiteBoxTarget, target: 'all', force: true });
    assert.ok(!existsSync(join(whiteBoxTarget, 'skills', 'shodan-intel')), 'Skill removed');
    assert.ok(!existsSync(join(whiteBoxTarget, '.packai', 'knowledge')), 'Knowledge removed');
    assert.ok(!existsSync(join(whiteBoxTarget, '.claude', 'agents', 'scanner.md')), 'Claude subagent removed');
  });

  it('SCENARIO 2 (BLACK-BOX): Packs bespoke framework, validates preflight, injects secrets, and executes', async () => {
    // 1. Pack bespoke python swarm system
    const blackBoxArchive = join(rootDir, 'blackbox.packai');
    await packCommand(blackBoxSource, { output: blackBoxArchive });
    assert.ok(existsSync(blackBoxArchive), 'Black-box .packai bundle must exist');

    // 2. Provision onto target project
    mkdirSync(blackBoxTarget, { recursive: true });
    await applyCommand(blackBoxArchive, { cwd: blackBoxTarget, target: 'all', force: true });

    // 3. Inject secret into keychain/env for test
    setCredential('EXOTIC_SWARM_SECRET', 'super_secret_quantum_key_999');

    // 4. Execute via packai run
    await runCommand(blackBoxSource, { cwd: blackBoxSource, force: true });
  });

  it('SCENARIO 3 (EXPORTERS): Generates official Claude, Cursor, and Codex plugin manifests simultaneously', async () => {
    mkdirSync(exportDistDir, { recursive: true });
    const { manifest } = loadManifest(whiteBoxPackDir);

    const results = exportAllPlugins(manifest, whiteBoxPackDir, exportDistDir);

    // Verify Claude Code Plugin
    assert.ok(existsSync(results.claude.manifestFile), 'Claude plugin.json must exist');
    assert.ok(existsSync(results.claude.claudeMdFile), 'Claude CLAUDE.md must exist');
    assert.ok(existsSync(join(results.claude.pluginDir, 'agents', 'scanner.md')), 'Claude agent in plugin must exist');

    // Verify Cursor Plugin
    assert.ok(existsSync(results.cursor.manifestFile), 'Cursor plugin.json must exist');
    assert.ok(existsSync(results.cursor.cursorrulesFile), 'Cursor .cursorrules must exist');
    assert.ok(existsSync(join(results.cursor.pluginDir, 'rules', 'exploiter.mdc')), 'Cursor rule in plugin must exist');

    // Verify Codex Plugin
    assert.ok(existsSync(results.codex.manifestFile), 'Codex ai-plugin.json must exist');
    assert.ok(existsSync(results.codex.agentsMdFile), 'Codex AGENTS.md must exist');
  });
});
