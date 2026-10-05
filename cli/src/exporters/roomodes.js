import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Roo-Code / Cline Custom Modes Exporter (.roomodes)
 */
export function exportToRooModes(manifest, packDir) {
  const customModes = [];

  if (manifest.agents && manifest.agents.length > 0) {
    for (const agent of manifest.agents) {
      let instructions = '';
      if (agent.persona?.file) {
        try {
          instructions = readFileSync(join(packDir, agent.persona.file), 'utf-8');
        } catch {
          instructions = agent.persona.instructions || '';
        }
      } else if (agent.persona?.instructions) {
        instructions = agent.persona.instructions;
      }

      if (agent.rules?.items) {
        instructions += '\n\nDirectives:\n' + agent.rules.items.map(r => `- ${r}`).join('\n');
      }

      customModes.push({
        slug: agent.id,
        name: agent.name,
        roleDefinition: agent.description || `Specialist agent for ${agent.name}`,
        groups: ['read', 'edit', 'command', 'mcp'],
        customInstructions: instructions.trim()
      });
    }
  } else {
    // Single agent pack
    customModes.push({
      slug: manifest.name,
      name: manifest.name,
      roleDefinition: manifest.description,
      groups: ['read', 'edit', 'command', 'mcp'],
      customInstructions: manifest.persona?.instructions || ''
    });
  }

  return JSON.stringify({ customModes }, null, 2) + '\n';
}
