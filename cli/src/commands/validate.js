import { readFileSync, existsSync, statSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import os from 'os';
import { safeExtractZip, auditMcpSecurity, auditPromptInjection } from '../utils/security.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { log } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadManifest(packPath) {
  const dir = resolve(packPath || '.');
  const candidates = [
    'packai.yaml',
    'packai.yml',
    'aipack.yaml',
    'aipack.yml',
    'manifest.json'
  ];

  let manifestPath = null;
  let isYaml = false;

  for (const c of candidates) {
    const full = join(dir, c);
    if (existsSync(full)) {
      manifestPath = full;
      isYaml = c.endsWith('.yaml') || c.endsWith('.yml');
      break;
    }
  }

  if (!manifestPath) {
    throw new Error(`Pack manifest not found in ${dir}. Expected packai.yaml, aipack.yaml or manifest.json`);
  }

  const raw = readFileSync(manifestPath, 'utf-8');
  let manifest;
  try {
    manifest = isYaml ? YAML.parse(raw) : JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid format in ${basename(manifestPath)}: ${e.message}`);
  }

  // --- Standards-First Companion Files Auto-Detection ---

  // 1. Companion AGENTS.md (Linux Foundation AAIF Standard)
  const agentsMdPath = join(dir, 'AGENTS.md');
  if (existsSync(agentsMdPath)) {
    if (!manifest.rules) {
      manifest.rules = { file: 'AGENTS.md' };
    }
    if (!manifest.persona) {
      manifest.persona = {
        role: manifest.name || 'AI Assistant',
        instructions: 'Refer to AGENTS.md for operating guidelines and core rules.'
      };
    }
  }

  // 2. Companion mcp.json
  const mcpJsonPath = join(dir, 'mcp.json');
  if (existsSync(mcpJsonPath)) {
    try {
      const mcpRaw = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));
      const servers = [];
      const rawServers = mcpRaw.mcpServers || mcpRaw;
      for (const [key, val] of Object.entries(rawServers)) {
        servers.push({
          id: key,
          name: key,
          command: val.command || 'npx',
          args: val.args || [],
          env: val.env || {}
        });
      }
      if (!manifest.tools) manifest.tools = {};
      if (!manifest.tools.mcp_servers || manifest.tools.mcp_servers.length === 0) {
        manifest.tools.mcp_servers = servers;
      }
    } catch {}
  }

  // 3. Companion skills/ directory (standard Agent Skills format)
  const skillsDir = join(dir, 'skills');
  if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
    try {
      const entries = readdirSync(skillsDir, { withFileTypes: true });
      const detectedSkills = [];
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const skillFile = join(skillsDir, ent.name, 'SKILL.md');
          if (existsSync(skillFile)) {
            detectedSkills.push(ent.name);
          }
        }
      }
      if (detectedSkills.length > 0 && (!manifest.agents || manifest.agents.length === 0)) {
        manifest.agents = detectedSkills.map(s => ({
          id: s,
          name: s,
          description: `Agent skill: ${s}`,
          persona: { file: `skills/${s}/SKILL.md` }
        }));
      }
    } catch {}
  }

  // --- Normalizations ---
  if (!manifest.spec_version) manifest.spec_version = '2.0';
  manifest.spec_version = String(manifest.spec_version);
  if (!manifest.category) manifest.category = 'coding';

  if (!manifest.level) {
    if (manifest.workflow || (manifest.agents && manifest.agents.length > 1)) {
      manifest.level = 'system';
    } else if (manifest.tools?.mcp_servers?.length > 0 || manifest.agents?.length === 1) {
      manifest.level = 'enhanced';
    } else {
      manifest.level = 'simple';
    }
  }

  // Normalize requirements
  if (manifest.requirements) {
    // Normalize secrets: string -> { id, required: true }, or env -> id
    if (manifest.requirements.secrets && Array.isArray(manifest.requirements.secrets)) {
      manifest.requirements.secrets = manifest.requirements.secrets.map(sec => {
        if (typeof sec === 'string') {
          return { id: sec, required: true };
        }
        if (!sec.id && sec.env) sec.id = sec.env;
        if (sec.required === undefined && sec.optional !== undefined) {
          sec.required = !sec.optional;
        }
        return sec;
      });
    }
    // Normalize binaries: string -> { name }, or minVersion -> min_version
    if (manifest.requirements.binaries && Array.isArray(manifest.requirements.binaries)) {
      manifest.requirements.binaries = manifest.requirements.binaries.map(b => {
        if (typeof b === 'string') {
          return { name: b };
        }
        if (!b.min_version && b.minVersion) b.min_version = b.minVersion;
        return b;
      });
    }
  }

  return { manifest, manifestPath, dir, isYaml };
}

export async function loadManifestAsync(packPath) {
  const target = resolve(packPath || '.');
  if (
    existsSync(target) &&
    statSync(target).isFile() &&
    (target.endsWith('.packai') || target.endsWith('.aipack') || target.endsWith('.zip'))
  ) {
    const tempDir = join(os.tmpdir(), `packai-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(tempDir, { recursive: true });
    await safeExtractZip(target, tempDir);
    const { manifest, manifestPath } = loadManifest(tempDir);
    return { manifest, manifestPath, dir: tempDir, isTemp: true };
  }
  return { ...loadManifest(packPath), isTemp: false };
}

export function validateManifest(manifest) {
  const schemaPath = join(__dirname, '..', 'schema', 'manifest.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  const ajv = new Ajv({ allErrors: true });
  // Add format validators if ajv-formats is available
  try {
    addFormats(ajv);
  } catch {
    // ajv-formats not installed, skip format validation
  }
  
  const validate = ajv.compile(schema);
  const valid = validate(manifest);

  return {
    valid,
    errors: validate.errors || [],
  };
}

export function runSemanticChecks(manifest, dir) {
  const warnings = [];
  const errors = [];

  // Check level consistency
  if (manifest.level === 'simple') {
    if (manifest.agents) warnings.push('Level is "simple" but "agents" block is defined. Consider level "system".');
    if (manifest.tools) warnings.push('Level is "simple" but "tools" block is defined. Consider level "enhanced".');
    if (manifest.knowledge) warnings.push('Level is "simple" but "knowledge" block is defined. Consider level "enhanced".');
  }

  if (manifest.level === 'enhanced') {
    if (manifest.agents && manifest.agents.length > 1) {
      warnings.push('Level is "enhanced" but multiple agents are defined. Consider level "system".');
    }
  }

  if (manifest.level === 'system') {
    if (!manifest.agents || manifest.agents.length === 0) {
      errors.push('Level is "system" but no agents are defined.');
    }
  }

  // Check persona has either inline or file, not both
  if (manifest.persona) {
    if (manifest.persona.instructions && manifest.persona.file) {
      errors.push('Persona cannot have both "instructions" and "file". Use one or the other.');
    }
    if (manifest.persona.file && !existsSync(join(dir, manifest.persona.file))) {
      errors.push(`Persona file not found: ${manifest.persona.file}`);
    }
  }

  // Check rules has either inline or file, not both
  if (manifest.rules) {
    if (manifest.rules.items && manifest.rules.file) {
      errors.push('Rules cannot have both "items" and "file". Use one or the other.');
    }
    if (manifest.rules.file && !existsSync(join(dir, manifest.rules.file))) {
      errors.push(`Rules file not found: ${manifest.rules.file}`);
    }
  }

  // Check embedded knowledge files exist
  if (manifest.knowledge) {
    for (const k of manifest.knowledge) {
      if (k.type === 'embedded' && k.path && !existsSync(join(dir, k.path))) {
        errors.push(`Knowledge file not found: ${k.path}`);
      }
    }
  }

  // Check workflow references valid agent IDs
  if (manifest.workflow && manifest.agents) {
    const agentIds = new Set(manifest.agents.map(a => a.id));
    if (!agentIds.has(manifest.workflow.entry)) {
      errors.push(`Workflow entry agent "${manifest.workflow.entry}" is not defined in agents.`);
    }
    for (const route of manifest.workflow.routes || []) {
      if (!agentIds.has(route.from)) {
        errors.push(`Workflow route references unknown agent: "${route.from}"`);
      }
      if (!agentIds.has(route.to)) {
        errors.push(`Workflow route references unknown agent: "${route.to}"`);
      }
    }
  }

  // Check agent files exist
  if (manifest.agents && Array.isArray(manifest.agents)) {
    for (const agent of manifest.agents) {
      if (agent.persona?.file && !existsSync(join(dir, agent.persona.file))) {
        errors.push(`Agent "${agent.id}" persona file not found: ${agent.persona.file}`);
      }
      if (agent.rules?.file && !existsSync(join(dir, agent.rules.file))) {
        errors.push(`Agent "${agent.id}" rules file not found: ${agent.rules.file}`);
      }
    }
  }

  // Check skills files exist
  if (manifest.skills && Array.isArray(manifest.skills)) {
    for (const s of manifest.skills) {
      if (s.path && !existsSync(join(dir, s.path))) {
        warnings.push(`Skill file referenced in manifest but not found on disk: ${s.path}`);
      }
    }
  }

  // Check execution entrypoint exists if specified
  if (manifest.execution?.entrypoint) {
    if (!existsSync(join(dir, manifest.execution.entrypoint))) {
      errors.push(`Execution entrypoint not found: ${manifest.execution.entrypoint}`);
    }
  }

  // Security Shield: Audit MCP tools for dangerous shell commands
  if (manifest.tools?.mcp_servers && Array.isArray(manifest.tools.mcp_servers)) {
    const mcpAudit = auditMcpSecurity(manifest.tools.mcp_servers);
    if (!mcpAudit.safe) {
      for (const threat of mcpAudit.threats) {
        errors.push(`[SECURITY HAZARD] MCP server "${threat.server}" contains dangerous command: ${threat.threat} (${threat.command})`);
      }
    }
  }

  // Security Shield: Audit prompt injection & system override signatures
  if (manifest.persona?.instructions) {
    const promptAudit = auditPromptInjection(manifest.persona.instructions);
    if (!promptAudit.clean) {
      for (const w of promptAudit.warnings) {
        warnings.push(`[SECURITY NOTICE] Persona prompt contains potential injection signature: ${w}`);
      }
    }
  }

  return { errors, warnings };
}

export async function validateCommand(path) {
  try {
    const { manifest, dir } = loadManifest(path);

    log.heading('Validating AIPack manifest');
    log.item('Pack', manifest.name || 'unknown');
    log.item('Path', dir);
    console.log();

    // Schema validation
    const schemaResult = validateManifest(manifest);
    if (!schemaResult.valid) {
      log.error('Schema validation failed:');
      for (const err of schemaResult.errors) {
        log.error(`  ${err.instancePath || '/'}: ${err.message}`);
      }
      process.exit(1);
    }
    log.success('Schema validation passed');

    // Semantic checks
    const semantic = runSemanticChecks(manifest, dir);
    
    for (const w of semantic.warnings) {
      log.warn(w);
    }
    for (const e of semantic.errors) {
      log.error(e);
    }

    if (semantic.errors.length > 0) {
      console.log();
      log.error(`Validation failed with ${semantic.errors.length} error(s).`);
      process.exit(1);
    }

    console.log();
    log.success(`Pack "${manifest.name}" is valid! (Level: ${manifest.level})`);

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
