import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Windsurf Cascade Exporter (.windsurfrules)
 */
export function exportToWindsurf(manifest, packDir) {
  let output = '';

  output += `# Windsurf Cascade Rules for ${manifest.name} (v${manifest.version})\n\n`;
  output += `${manifest.description}\n\n`;

  const persona = manifest.persona;
  if (persona) {
    output += '## Identity & Role\n\n';
    if (persona.file) {
      try {
        output += readFileSync(join(packDir, persona.file), 'utf-8') + '\n\n';
      } catch {
        output += (persona.instructions || '') + '\n\n';
      }
    } else {
      if (persona.role) output += `You are operating as: ${persona.role}.\n\n`;
      if (persona.instructions) output += `${persona.instructions}\n\n`;
    }
  }

  const rules = manifest.rules;
  if (rules) {
    output += '## Coding & Architecture Rules\n\n';
    if (rules.file) {
      try {
        output += readFileSync(join(packDir, rules.file), 'utf-8') + '\n\n';
      } catch {
        // fallback
      }
    } else if (rules.items) {
      for (const r of rules.items) output += `- ${r}\n`;
      output += '\n';
    }
  }

  if (manifest.agents && manifest.agents.length > 0) {
    output += '## Specialized Agent Roles\n\n';
    for (const a of manifest.agents) {
      output += `### ${a.name} (\`${a.id}\`)\n`;
      if (a.description) output += `${a.description}\n\n`;
      if (a.persona?.file) {
        try {
          output += readFileSync(join(packDir, a.persona.file), 'utf-8') + '\n\n';
        } catch {
          if (a.persona?.instructions) output += a.persona.instructions + '\n\n';
        }
      } else if (a.persona?.instructions) {
        output += a.persona.instructions + '\n\n';
      }
    }
  }

  return output.trim() + '\n';
}
