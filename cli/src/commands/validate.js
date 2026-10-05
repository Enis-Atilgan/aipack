import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { log } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadManifest(packPath) {
  const dir = resolve(packPath || '.');
  const manifestPath = join(dir, 'manifest.json');

  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${dir}`);
  }

  const raw = readFileSync(manifestPath, 'utf-8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in manifest.json: ${e.message}`);
  }

  return { manifest, manifestPath, dir };
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
    if (manifest.agents) warnings.push('Level is "enhanced" but "agents" block is defined. Consider level "system".');
  }

  if (manifest.level === 'system') {
    if (!manifest.agents || manifest.agents.length === 0) {
      errors.push('Level is "system" but no agents are defined.');
    }
    if (!manifest.workflow) {
      warnings.push('Level is "system" but no workflow is defined. Agents won\'t be orchestrated.');
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
