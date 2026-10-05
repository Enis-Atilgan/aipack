import { readFileSync } from 'fs';
import { join } from 'path';

export function exportToClaude(manifest, packDir) {
  let output = '';

  // Header
  output += `# CLAUDE.md\n\n`;
  output += `> Generated from aipack: **${manifest.name}** v${manifest.version}\n\n`;
  output += `${manifest.description}\n\n`;
  output += `---\n\n`;

  // Persona
  const persona = manifest.persona;
  if (persona) {
    output += '## Identity & Behavior\n\n';
    if (persona.file) {
      try {
        output += readFileSync(join(packDir, persona.file), 'utf-8') + '\n\n';
      } catch {
        output += `<!-- Error: Could not read ${persona.file} -->\n\n`;
      }
    } else {
      if (persona.role) output += `**Role:** ${persona.role}\n\n`;
      if (persona.tone) output += `**Tone:** ${persona.tone}\n\n`;
      if (persona.expertise) output += `**Expertise:** ${persona.expertise.join(', ')}\n\n`;
      if (persona.language) output += `**Language:** ${persona.language}\n\n`;
      if (persona.instructions) output += persona.instructions + '\n\n';
    }
  }

  // Rules
  const rules = manifest.rules;
  if (rules) {
    output += '## Rules\n\n';
    output += 'You MUST follow these rules at all times:\n\n';
    if (rules.file) {
      try {
        output += readFileSync(join(packDir, rules.file), 'utf-8') + '\n\n';
      } catch {
        output += `<!-- Error: Could not read ${rules.file} -->\n\n`;
      }
    } else if (rules.items) {
      for (const rule of rules.items) {
        output += `- ${rule}\n`;
      }
      output += '\n';
    }
  }

  // Knowledge
  const knowledge = manifest.knowledge;
  if (knowledge) {
    const embedded = knowledge.filter(k => k.type === 'embedded');
    if (embedded.length > 0) {
      output += '## Reference Knowledge\n\n';
      for (const k of embedded) {
        output += `### ${k.name}\n\n`;
        if (k.description) output += `${k.description}\n\n`;
        if (k.path) {
          try {
            output += readFileSync(join(packDir, k.path), 'utf-8') + '\n\n';
          } catch {
            output += `<!-- Error: Could not read ${k.path} -->\n\n`;
          }
        }
      }
    }
  }

  // MCP tools note
  if (manifest.tools && manifest.tools.mcp_servers) {
    output += '## Required Tools (MCP)\n\n';
    output += 'This pack requires the following MCP servers:\n\n';
    for (const server of manifest.tools.mcp_servers) {
      output += `- **${server.name}**`;
      if (server.description) output += `: ${server.description}`;
      if (server.source) output += ` (\`${server.source}\`)`;
      output += '\n';
    }
    output += '\n';
  }

  return output.trim() + '\n';
}
