import { writeFileSync, mkdirSync, existsSync, cpSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { exportToClaude } from './claude.js';
import { exportToCursor } from './cursor.js';
import { exportToAgentsMd } from './agentsmd.js';
import { exportToChatGPT } from './chatgpt.js';

function buildMcpServersDict(mcpServers = []) {
  const dict = {};
  for (const s of mcpServers) {
    dict[s.id || s.name] = {
      command: s.command || s.source || 'npx',
      args: s.args || [],
      env: s.env || s.config || {}
    };
  }
  return dict;
}

/**
 * Export pack as an official Claude Code Plugin (.claude-plugin/plugin.json + agents + mcp)
 */
export function exportClaudePlugin(manifest, dir, outputDir) {
  const out = resolve(outputDir);
  const pluginDir = join(out, '.claude-plugin');
  mkdirSync(pluginDir, { recursive: true });

  let fileCount = 0;

  // 1. .claude-plugin/plugin.json
  const pluginJson = {
    name: manifest.name,
    version: manifest.version || '1.0.0',
    description: manifest.description || `${manifest.name} Claude Code Plugin`,
    author: manifest.author?.name || 'developer',
    license: manifest.license || 'MIT',
    keywords: manifest.tags?.length > 0 ? manifest.tags : ['ai', 'agent', manifest.category || 'coding']
  };
  writeFileSync(join(pluginDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n', 'utf-8');
  fileCount++;

  // 2. CLAUDE.md master instructions
  const claudeMd = exportToClaude(manifest, dir);
  writeFileSync(join(out, 'CLAUDE.md'), claudeMd, 'utf-8');
  fileCount++;

  // 3. Subagents in agents/*.md
  if (manifest.agents && Array.isArray(manifest.agents) && manifest.agents.length > 0) {
    const agentsDir = join(out, 'agents');
    mkdirSync(agentsDir, { recursive: true });

    for (const agent of manifest.agents) {
      const toolsStr = Array.isArray(agent.tools) && agent.tools.length > 0
        ? agent.tools.join(', ')
        : 'Read, Edit, Bash, Glob, Grep, Write';
      const modelStr = agent.model_preference || 'inherit';
      const descStr = (agent.description || agent.name).replace(/\n/g, ' ');

      let content = `---\nname: ${agent.id}\ndescription: ${descStr}\ntools: ${toolsStr}\nmodel: ${modelStr}\n---\n\n`;
      content += `# Agent: ${agent.name} (${agent.id})\n\n`;
      if (agent.description) content += `${agent.description}\n\n`;
      if (agent.model_preference) content += `**Model Preference:** ${agent.model_preference}\n\n`;

      if (agent.persona?.file) {
        try {
          content += readFileSync(join(dir, agent.persona.file), 'utf-8');
        } catch {
          content += agent.persona.instructions || '';
        }
      } else if (agent.persona?.instructions) {
        content += agent.persona.instructions;
      }

      writeFileSync(join(agentsDir, `${agent.id}.md`), content, 'utf-8');
      fileCount++;
    }
  }

  // 4. MCP Servers in .mcp.json
  const mcpServers = manifest.tools?.mcp_servers || [];
  if (mcpServers.length > 0) {
    const mcpDict = buildMcpServersDict(mcpServers);
    writeFileSync(join(out, '.mcp.json'), JSON.stringify({ mcpServers: mcpDict }, null, 2) + '\n', 'utf-8');
    fileCount++;
  }

  // 5. Skills directory if present in pack source
  const srcSkillsDir = join(dir, 'skills');
  if (existsSync(srcSkillsDir)) {
    cpSync(srcSkillsDir, join(out, 'skills'), { recursive: true });
    fileCount++;
  }

  return {
    target: 'claude-plugin',
    outputDir: out,
    pluginDir: out,
    manifestFile: join(pluginDir, 'plugin.json'),
    claudeMdFile: join(out, 'CLAUDE.md'),
    fileCount
  };
}

/**
 * Export pack as an official Cursor Plugin (.cursor-plugin/plugin.json + rules + mcp)
 */
export function exportCursorPlugin(manifest, dir, outputDir) {
  const out = resolve(outputDir);
  const pluginDir = join(out, '.cursor-plugin');
  mkdirSync(pluginDir, { recursive: true });

  let fileCount = 0;

  // 1. .cursor-plugin/plugin.json
  const pluginJson = {
    name: manifest.name,
    version: manifest.version || '1.0.0',
    description: manifest.description || `${manifest.name} Cursor Plugin`,
    author: manifest.author?.name || 'developer',
    license: manifest.license || 'MIT'
  };
  writeFileSync(join(pluginDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n', 'utf-8');
  fileCount++;

  // 2. .cursorrules
  const cursorRules = exportToCursor(manifest, dir);
  writeFileSync(join(out, '.cursorrules'), cursorRules, 'utf-8');
  fileCount++;

  // 3. Modular rules in rules/*.mdc
  if (manifest.agents && Array.isArray(manifest.agents) && manifest.agents.length > 0) {
    const rulesDir = join(out, 'rules');
    mkdirSync(rulesDir, { recursive: true });

    const entryAgentId = manifest.workflow?.entry;
    for (const agent of manifest.agents) {
      const isEntry = entryAgentId === agent.id;
      const descStr = (agent.description || agent.name).replace(/\n/g, ' ');
      const globsStr = agent.globs ? (Array.isArray(agent.globs) ? agent.globs.join(', ') : agent.globs) : '';

      let content = `---\ndescription: ${descStr}\n`;
      if (globsStr) content += `globs: ${globsStr}\n`;
      content += `alwaysApply: ${isEntry ? 'true' : 'false'}\n---\n\n`;
      content += `# Agent: ${agent.name} (${agent.id})\n\n`;

      if (agent.persona?.file) {
        try {
          content += readFileSync(join(dir, agent.persona.file), 'utf-8') + '\n\n';
        } catch {
          content += (agent.persona.instructions || '') + '\n\n';
        }
      } else if (agent.persona?.instructions) {
        content += agent.persona.instructions + '\n\n';
      }

      if (agent.rules?.items) {
        content += `## Rules\n`;
        for (const r of agent.rules.items) content += `- ${r}\n`;
        content += '\n';
      }

      writeFileSync(join(rulesDir, `${agent.id}.mdc`), content, 'utf-8');
      fileCount++;
    }
  }

  // 4. mcp.json
  const mcpServers = manifest.tools?.mcp_servers || [];
  if (mcpServers.length > 0) {
    const mcpDict = buildMcpServersDict(mcpServers);
    writeFileSync(join(out, 'mcp.json'), JSON.stringify({ mcpServers: mcpDict }, null, 2) + '\n', 'utf-8');
    fileCount++;
  }

  return {
    target: 'cursor-plugin',
    outputDir: out,
    pluginDir: out,
    manifestFile: join(pluginDir, 'plugin.json'),
    cursorrulesFile: join(out, '.cursorrules'),
    fileCount
  };
}

/**
 * Export pack as OpenAI Codex / ChatGPT plugin bundle (ai-plugin.json + AGENTS.md + instructions)
 */
export function exportCodexPlugin(manifest, dir, outputDir) {
  const out = resolve(outputDir);
  mkdirSync(out, { recursive: true });

  let fileCount = 0;

  // 1. ai-plugin.json
  const safeModelName = manifest.name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);
  const pluginJson = {
    schema_version: 'v1',
    name_for_human: manifest.display_name || manifest.name,
    name_for_model: safeModelName,
    description_for_human: manifest.description || `${manifest.name} Assistant`,
    description_for_model: manifest.description || `${manifest.name} AI Agent Workforce`,
    auth: { type: 'none' },
    api: { type: 'none' },
    logo_url: 'https://packai.dev/logo.png',
    contact_email: 'support@packai.dev',
    legal_info_url: 'https://packai.dev/legal'
  };
  writeFileSync(join(out, 'ai-plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n', 'utf-8');
  fileCount++;

  // 2. AGENTS.md (AAIF Open Standard)
  const agentsMd = exportToAgentsMd(manifest, dir);
  writeFileSync(join(out, 'AGENTS.md'), agentsMd, 'utf-8');
  fileCount++;

  // 3. custom_instructions.txt
  const chatGptInstructions = exportToChatGPT(manifest, dir);
  writeFileSync(join(out, 'custom_instructions.txt'), chatGptInstructions, 'utf-8');
  fileCount++;

  return {
    target: 'codex-plugin',
    outputDir: out,
    pluginDir: out,
    manifestFile: join(out, 'ai-plugin.json'),
    agentsMdFile: join(out, 'AGENTS.md'),
    fileCount
  };
}

/**
 * Export all plugin formats simultaneously into subdirectories
 */
export function exportAllPlugins(manifest, dir, outputDir) {
  const out = resolve(outputDir);
  mkdirSync(out, { recursive: true });

  const claudeRes = exportClaudePlugin(manifest, dir, join(out, 'claude-plugin'));
  const cursorRes = exportCursorPlugin(manifest, dir, join(out, 'cursor-plugin'));
  const codexRes = exportCodexPlugin(manifest, dir, join(out, 'codex-plugin'));

  return {
    target: 'plugins',
    outputDir: out,
    claude: claudeRes,
    cursor: cursorRes,
    codex: codexRes,
    plugins: [claudeRes, cursorRes, codexRes],
    fileCount: claudeRes.fileCount + cursorRes.fileCount + codexRes.fileCount
  };
}
