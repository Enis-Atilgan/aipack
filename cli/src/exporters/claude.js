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

  // Level 3: Multi-Agent Architecture
  if (manifest.agents && manifest.agents.length > 0) {
    output += '## Multi-Agent Workforce (Level 3 System)\n\n';
    output += 'This system operates with a coordinated team of specialized agents:\n\n';

    for (const agent of manifest.agents) {
      output += `### Agent: ${agent.name} (\`${agent.id}\`)\n\n`;
      if (agent.description) output += `${agent.description}\n\n`;
      if (agent.model_preference) output += `* **Model Tier:** \`${agent.model_preference}\`\n`;

      if (agent.persona?.file) {
        try {
          output += readFileSync(join(packDir, agent.persona.file), 'utf-8') + '\n\n';
        } catch {
          if (agent.persona.instructions) output += agent.persona.instructions + '\n\n';
        }
      } else if (agent.persona?.instructions) {
        output += agent.persona.instructions + '\n\n';
      }

      if (agent.rules?.items) {
        output += `* **Rules for ${agent.name}:**\n`;
        for (const r of agent.rules.items) output += `  - ${r}\n`;
        output += '\n';
      }
    }
  }

  // Level 3: Workflow & Routing Rules
  if (manifest.workflow) {
    output += '## Orchestration & Routing Rules\n\n';
    if (manifest.workflow.entry) {
      output += `* **Entrypoint Agent:** \`${manifest.workflow.entry}\` (Primary dispatcher)\n`;
    }

    if (manifest.workflow.shared_context) {
      const sc = manifest.workflow.shared_context;
      output += `* **Context Policy:** Retain up to ${sc.max_history_messages || 20} recent messages across agent handoffs.\n`;
    }

    if (manifest.workflow.routes && manifest.workflow.routes.length > 0) {
      output += '\n### Routing Decision Table\n\n';
      output += '| Source Agent | Target Agent | Condition / Intent |\n';
      output += '| :--- | :--- | :--- |\n';
      for (const r of manifest.workflow.routes) {
        output += `| \`${r.from}\` | \`${r.to}\` | ${r.condition}${r.fallback ? ' *(fallback)*' : ''} |\n`;
      }
      output += '\n';
    }
  }

  return output.trim() + '\n';
}
