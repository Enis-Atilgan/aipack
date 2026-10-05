import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, cpSync, statSync } from 'fs';
import { join, resolve, basename } from 'path';
import YAML from 'yaml';
import chalk from 'chalk';
import { log } from '../utils/logger.js';

const TEMPLATES = {
  simple: {
    manifest: (name, category) => ({
      spec_version: '2.0',
      name,
      version: '1.0.0',
      description: `A ${category} AI assistant pack`,
      author: { name: 'developer', github: 'developer' },
      level: 'simple',
      category,
      persona: {
        role: 'AI Assistant',
        tone: 'Helpful, clear, concise',
        instructions: 'You are a helpful AI assistant. Customize this prompt to define your AI\'s behavior.'
      },
      rules: {
        items: [
          'Always be accurate and honest',
          'If unsure, say so rather than guessing'
        ]
      }
    }),
    dirs: [],
    files: [
      {
        path: 'AGENTS.md',
        content: '# Universal Agent Rules (Linux Foundation AAIF)\n\n- Always be accurate and honest\n- If unsure, say so rather than guessing\n'
      }
    ]
  },

  enhanced: {
    manifest: (name, category) => ({
      spec_version: '2.0',
      name,
      version: '1.0.0',
      description: `An enhanced ${category} AI assistant with tools and knowledge`,
      author: { name: 'developer', github: 'developer' },
      level: 'enhanced',
      category,
      persona: {
        file: './persona/system.md'
      },
      rules: {
        file: 'AGENTS.md'
      },
      knowledge: [
        {
          name: 'reference-docs',
          description: 'Reference documentation',
          type: 'embedded',
          path: './knowledge/reference.md',
          format: 'markdown'
        }
      ],
      tools: {
        mcp_servers: []
      }
    }),
    dirs: ['persona', 'knowledge'],
    files: [
      {
        path: 'AGENTS.md',
        content: '# Universal Agent Rules (Linux Foundation AAIF)\n\n- Always be accurate and honest\n- If unsure, say so rather than guessing\n- Follow idioms and style guidelines for this project\n'
      },
      {
        path: 'mcp.json',
        content: '{\n  "mcpServers": {}\n}\n'
      },
      {
        path: 'persona/system.md',
        content: '# System Prompt\n\nYou are a helpful AI assistant.\n\nCustomize this file to define your AI\'s identity, tone, and behavior.\n'
      },
      {
        path: 'knowledge/reference.md',
        content: '# Reference Knowledge\n\nAdd your reference documentation here.\n\nThis content will be included in the AI\'s context when exported.\n'
      }
    ]
  },

  system: {
    manifest: (name, category) => ({
      spec_version: '2.0',
      name,
      version: '1.0.0',
      description: `A multi-agent ${category} AI system`,
      author: { name: 'developer', github: 'developer' },
      level: 'system',
      category,
      persona: {
        file: './persona/system.md'
      },
      rules: {
        file: 'AGENTS.md'
      },
      knowledge: [
        {
          name: 'shared-knowledge',
          description: 'Shared knowledge base for all agents',
          type: 'embedded',
          path: './knowledge/shared.md',
          format: 'markdown'
        }
      ],
      tools: {
        mcp_servers: []
      },
      agents: [
        {
          id: 'router',
          name: 'Router',
          description: 'Routes incoming messages to the appropriate specialist agent',
          model_preference: 'fast',
          persona: { file: './agents/router/system.md' },
          rules: {
            items: [
              'Only route messages, do not answer questions directly',
              'If uncertain, ask the user for clarification'
            ]
          }
        },
        {
          id: 'specialist',
          name: 'Specialist',
          description: 'Handles specialized tasks',
          model_preference: 'smart',
          persona: { file: './agents/specialist/system.md' },
          knowledge: [{ ref: 'shared-knowledge' }]
        }
      ],
      workflow: {
        entry: 'router',
        routes: [
          { from: 'router', to: 'specialist', condition: "intent == 'specialized_task'" },
          { from: 'router', to: 'router', condition: 'default', fallback: true }
        ],
        shared_context: {
          pass_conversation_history: true,
          max_history_messages: 20
        }
      },
      requirements: {
        platform: {
          os: ['darwin', 'linux', 'win32'],
          min_ram_gb: 8
        },
        binaries: [],
        services: [],
        secrets: [],
        sandbox: 'advisory'
      }
    }),
    dirs: ['persona', 'knowledge', 'agents/router', 'agents/specialist'],
    files: [
      {
        path: 'AGENTS.md',
        content: '# Universal Agent Rules (Linux Foundation AAIF)\n\n- Always coordinate through the Router agent\n- Specialists must adhere to their distinct operational domains\n- Maintain clean audit logs\n'
      },
      {
        path: 'mcp.json',
        content: '{\n  "mcpServers": {}\n}\n'
      },
      {
        path: 'persona/system.md',
        content: '# System Prompt\n\nYou are the primary AI coordinator in a multi-agent system.\n\nCustomize this file.\n'
      },
      {
        path: 'knowledge/shared.md',
        content: '# Shared Knowledge\n\nAdd knowledge that all agents should have access to.\n'
      },
      {
        path: 'agents/router/system.md',
        content: '# Router Agent\n\nYou are a routing agent. Analyze incoming messages and route them to the appropriate specialist agent.\n\nDo not answer questions directly — only classify and route.\n'
      },
      {
        path: 'agents/specialist/system.md',
        content: '# Specialist Agent\n\nYou are a specialist agent that handles specific tasks.\n\nCustomize this prompt for your use case.\n'
      }
    ]
  }
};

/**
 * Reverse engineers existing workspace (.claude/, .cursor/, AGENTS.md, mcp.json)
 * into a turnkey pack skeleton.
 */
export async function initFromExisting(sourceDir, packName, options = {}) {
  const src = resolve(sourceDir || '.');
  const targetDir = resolve(packName || `${basename(src)}-pack`);

  if (!existsSync(src)) {
    log.error(`Source project directory does not exist: ${src}`);
    process.exit(1);
  }

  if (existsSync(targetDir)) {
    log.error(`Target directory "${targetDir}" already exists.`);
    process.exit(1);
  }

  console.log();
  console.log(chalk.bold.cyan('🐺 PackAI Ingestion & Reverse-Engineering Engine'));
  log.item('Source Project', src);
  log.item('Target Pack Skeleton', targetDir);
  console.log();

  // 1. Inspect Rules & Core Instructions
  let detectedRules = '';
  let sourceRuleType = null;
  const agentsMdSrc = join(src, 'AGENTS.md');
  const claudeMdSrc = join(src, 'CLAUDE.md');
  const cursorrulesSrc = join(src, '.cursorrules');
  const windsurfSrc = join(src, '.windsurfrules');

  if (existsSync(agentsMdSrc)) {
    detectedRules = readFileSync(agentsMdSrc, 'utf-8');
    sourceRuleType = 'AGENTS.md (AAIF Standard)';
  } else if (existsSync(claudeMdSrc)) {
    detectedRules = readFileSync(claudeMdSrc, 'utf-8');
    sourceRuleType = 'CLAUDE.md';
  } else if (existsSync(cursorrulesSrc)) {
    detectedRules = readFileSync(cursorrulesSrc, 'utf-8');
    sourceRuleType = '.cursorrules';
  } else if (existsSync(windsurfSrc)) {
    detectedRules = readFileSync(windsurfSrc, 'utf-8');
    sourceRuleType = '.windsurfrules';
  }

  // 2. Inspect Subagents & Modular Rules
  const detectedAgents = [];
  const claudeAgentsDir = join(src, '.claude', 'agents');
  if (existsSync(claudeAgentsDir)) {
    const files = readdirSync(claudeAgentsDir).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const content = readFileSync(join(claudeAgentsDir, f), 'utf-8');
      const agentId = basename(f, '.md');
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      let name = agentId;
      let description = `Agent ${agentId}`;
      let tools = [];
      let model = 'smart';
      let instructions = content;

      if (fmMatch) {
        try {
          const fm = YAML.parse(fmMatch[1]);
          name = fm.name || name;
          description = fm.description || description;
          model = fm.model === 'inherit' ? 'smart' : (fm.model || 'smart');
          if (fm.tools) {
            tools = Array.isArray(fm.tools) ? fm.tools : fm.tools.split(',').map(s => s.trim());
          }
        } catch {}
        instructions = fmMatch[2].trim();
      }

      detectedAgents.push({
        id: agentId,
        name,
        description,
        model_preference: model,
        tools,
        instructions
      });
    }
  }

  // Also check .cursor/rules/*.mdc
  const cursorRulesDir = join(src, '.cursor', 'rules');
  if (existsSync(cursorRulesDir)) {
    const files = readdirSync(cursorRulesDir).filter(f => f.endsWith('.mdc'));
    for (const f of files) {
      const agentId = basename(f, '.mdc');
      if (detectedAgents.some(a => a.id === agentId)) continue;
      const content = readFileSync(join(cursorRulesDir, f), 'utf-8');
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      let description = `Rule/Agent ${agentId}`;
      let globs = undefined;
      let instructions = content;

      if (fmMatch) {
        try {
          const fm = YAML.parse(fmMatch[1]);
          description = fm.description || description;
          globs = fm.globs;
        } catch {}
        instructions = fmMatch[2].trim();
      }

      detectedAgents.push({
        id: agentId,
        name: agentId,
        description,
        globs,
        instructions
      });
    }
  }

  // Also check Roo-Code / Cline custom modes (.roomodes or .cline/roomodes)
  const rooModesPath = existsSync(join(src, '.roomodes'))
    ? join(src, '.roomodes')
    : (existsSync(join(src, '.cline', 'roomodes')) ? join(src, '.cline', 'roomodes') : null);
  if (rooModesPath) {
    try {
      const parsed = JSON.parse(readFileSync(rooModesPath, 'utf-8'));
      if (Array.isArray(parsed.customModes)) {
        for (const mode of parsed.customModes) {
          const agentId = (mode.slug || mode.name || 'custom-mode').toLowerCase().replace(/[^a-z0-9-]/g, '-');
          if (detectedAgents.some(a => a.id === agentId)) continue;
          detectedAgents.push({
            id: agentId,
            name: mode.name || agentId,
            description: mode.roleDefinition || `Specialist agent for ${mode.name}`,
            model_preference: 'smart',
            tools: mode.groups || [],
            instructions: (mode.customInstructions || mode.roleDefinition || '').trim()
          });
        }
      }
    } catch {}
  }

  // Also check CrewAI agents (config/agents.yaml or agents.yaml)
  let crewAiDetected = false;
  const crewAiPath = existsSync(join(src, 'config', 'agents.yaml'))
    ? join(src, 'config', 'agents.yaml')
    : (existsSync(join(src, 'agents.yaml')) ? join(src, 'agents.yaml') : null);
  if (crewAiPath) {
    try {
      const parsed = YAML.parse(readFileSync(crewAiPath, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        crewAiDetected = true;
        for (const [agentKey, aData] of Object.entries(parsed)) {
          if (aData && typeof aData === 'object') {
            const agentId = agentKey.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            if (detectedAgents.some(a => a.id === agentId)) continue;
            const role = aData.role || agentKey;
            const goal = aData.goal || '';
            const backstory = aData.backstory || '';
            const instructions = `# ${role}\n\n**Goal:** ${goal}\n\n**Backstory:**\n${backstory}\n`;
            detectedAgents.push({
              id: agentId,
              name: role,
              description: goal || (backstory ? backstory.slice(0, 100) : `CrewAI Agent ${agentKey}`),
              model_preference: 'smart',
              instructions: instructions.trim()
            });
          }
        }
      }
    } catch {}
  }

  // Inspect Agent Skills (skills/<name>/SKILL.md or .claude/skills/<name>/SKILL.md)
  const detectedSkills = [];
  const skillsDirsToCheck = [join(src, 'skills'), join(src, '.claude', 'skills')];
  for (const sDir of skillsDirsToCheck) {
    if (existsSync(sDir) && statSync(sDir).isDirectory()) {
      try {
        const entries = readdirSync(sDir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            const skillFile = join(sDir, ent.name, 'SKILL.md');
            if (existsSync(skillFile)) {
              detectedSkills.push({
                name: ent.name,
                sourceDir: join(sDir, ent.name)
              });
            }
          }
        }
      } catch {}
    }
  }

  // Inspect Knowledge directory
  let knowledgeSrcDir = null;
  if (existsSync(join(src, 'knowledge')) && statSync(join(src, 'knowledge')).isDirectory()) {
    knowledgeSrcDir = join(src, 'knowledge');
  }

  // 3. Inspect MCP Tools & Extract Secrets / Binaries
  const detectedMcpServers = {};
  const detectedSecrets = new Set();
  const detectedBinaries = new Set();
  const detectedServices = new Set();

  const mcpLocations = [
    join(src, '.cursor', 'mcp.json'),
    join(src, '.claude', 'settings.json'),
    join(src, '.roo', 'mcp.json'),
    join(src, 'mcp.json')
  ];

  for (const loc of mcpLocations) {
    if (existsSync(loc)) {
      try {
        const raw = JSON.parse(readFileSync(loc, 'utf-8'));
        const servers = raw.mcpServers || {};
        for (const [sName, sVal] of Object.entries(servers)) {
          detectedMcpServers[sName] = sVal;
          if (sVal.command) {
            if (sVal.command === 'npx') detectedBinaries.add('node');
            else if (sVal.command === 'uvx') detectedBinaries.add('uvx');
            else if (sVal.command === 'python' || sVal.command === 'python3') detectedBinaries.add('python3');
            else detectedBinaries.add(sVal.command);
          }
          if (sVal.env) {
            for (const envKey of Object.keys(sVal.env)) {
              if (
                envKey.includes('TOKEN') ||
                envKey.includes('KEY') ||
                envKey.includes('SECRET') ||
                envKey.includes('PASS') ||
                envKey.includes('URL')
              ) {
                detectedSecrets.add(envKey);
              }
            }
          }
        }
      } catch {}
    }
  }

  // 4. Project ecosystem inspection & execution command detection
  if (existsSync(join(src, 'package.json'))) {
    detectedBinaries.add('node');
  }
  if (existsSync(join(src, 'pyproject.toml')) || existsSync(join(src, 'requirements.txt'))) {
    detectedBinaries.add('python3');
  }
  if (existsSync(join(src, 'Dockerfile')) || existsSync(join(src, 'docker-compose.yml'))) {
    detectedServices.add('docker');
  }

  let detectedExecution = undefined;
  if (crewAiDetected || existsSync(join(src, 'crew.py'))) {
    detectedExecution = { command: 'python -m crewai run' };
    detectedBinaries.add('python3');
  } else if (existsSync(join(src, 'main.py'))) {
    detectedExecution = { command: 'python main.py' };
    detectedBinaries.add('python3');
  } else if (existsSync(join(src, 'package.json'))) {
    try {
      const pJson = JSON.parse(readFileSync(join(src, 'package.json'), 'utf-8'));
      if (pJson.scripts?.start) {
        detectedExecution = { command: 'npm start' };
      }
    } catch {}
  }

  // 5. Determine level & workflow
  let level = 'simple';
  let workflow = undefined;
  if (detectedAgents.length > 1) {
    level = 'system';
    const entryAgent = detectedAgents[0].id;
    const routes = detectedAgents.slice(1).map(a => ({
      from: entryAgent,
      to: a.id,
      condition: `intent == '${a.id}'`
    }));
    routes.push({
      from: entryAgent,
      to: entryAgent,
      condition: 'default',
      fallback: true
    });
    workflow = {
      entry: entryAgent,
      routes,
      shared_context: {
        pass_conversation_history: true,
        max_history_messages: 20
      }
    };
  } else if (Object.keys(detectedMcpServers).length > 0 || detectedAgents.length === 1 || detectedSkills.length > 0) {
    level = 'enhanced';
  }

  // 6. Build Manifest Object
  const manifestName = basename(targetDir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const manifest = {
    spec_version: '2.0',
    name: manifestName,
    version: '1.0.0',
    description: `Pack reverse-engineered from ${basename(src)} workspace`,
    author: {
      name: process.env.USER || 'developer',
      github: process.env.USER || 'developer'
    },
    level,
    category: 'coding',
    requirements: {
      platform: {
        os: ['darwin', 'linux', 'win32'],
        min_ram_gb: 8
      },
      binaries: Array.from(detectedBinaries).map(b => ({
        name: b,
        min_version: b === 'node' ? '>=18.0.0' : undefined
      })),
      services: Array.from(detectedServices).map(s => ({
        name: s
      })),
      secrets: Array.from(detectedSecrets).map(sec => ({
        id: sec,
        label: sec.replace(/_/g, ' '),
        required: true
      })),
      sandbox: detectedServices.has('docker') ? 'docker' : 'advisory'
    }
  };

  if (detectedAgents.length > 0) {
    manifest.agents = detectedAgents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      model_preference: a.model_preference || 'smart',
      globs: a.globs,
      persona: { file: `./agents/${a.id}/system.md` },
      tools: a.tools?.length > 0 ? a.tools : undefined
    }));
  }

  if (workflow) {
    manifest.workflow = workflow;
  }

  if (detectedSkills.length > 0) {
    manifest.skills = detectedSkills.map(s => ({
      name: s.name,
      path: `./skills/${s.name}/SKILL.md`
    }));
  }

  if (knowledgeSrcDir) {
    manifest.knowledge = [
      {
        name: 'workspace-knowledge',
        description: 'Shared knowledge base reverse-engineered from workspace',
        type: 'embedded',
        path: './knowledge',
        format: 'markdown'
      }
    ];
  }

  if (detectedExecution) {
    manifest.execution = detectedExecution;
  }

  // 7. Write to Target Pack Directory
  mkdirSync(targetDir, { recursive: true });

  // Write packai.yaml
  writeFileSync(join(targetDir, 'packai.yaml'), YAML.stringify(manifest), 'utf-8');

  // Also write legacy manifest.json for full backward compatibility
  writeFileSync(join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  // Write AGENTS.md (AAIF universal standard)
  const universalAgentsMd = detectedRules || `# ${manifest.name} Operating Protocol\n\nUniversal agent instructions for this pack.\n`;
  writeFileSync(join(targetDir, 'AGENTS.md'), universalAgentsMd, 'utf-8');

  // Write mcp.json if servers detected
  if (Object.keys(detectedMcpServers).length > 0) {
    writeFileSync(
      join(targetDir, 'mcp.json'),
      JSON.stringify({ mcpServers: detectedMcpServers }, null, 2) + '\n',
      'utf-8'
    );
  }

  // Write subagents into agents/<id>/system.md
  if (detectedAgents.length > 0) {
    for (const a of detectedAgents) {
      const agentDir = join(targetDir, 'agents', a.id);
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, 'system.md'), a.instructions, 'utf-8');
    }
  }

  // Copy detected skills
  if (detectedSkills.length > 0) {
    const targetSkillsDir = join(targetDir, 'skills');
    mkdirSync(targetSkillsDir, { recursive: true });
    for (const skill of detectedSkills) {
      cpSync(skill.sourceDir, join(targetSkillsDir, skill.name), { recursive: true });
    }
  }

  // Copy detected knowledge
  if (knowledgeSrcDir) {
    const targetKnowledgeDir = join(targetDir, 'knowledge');
    mkdirSync(targetKnowledgeDir, { recursive: true });
    cpSync(knowledgeSrcDir, targetKnowledgeDir, { recursive: true });
  }

  // Write README.md
  const readme = `# ${manifest.name}\n\n${manifest.description}\n\n## Quick Start\n\n\`\`\`bash\n# Validate pack\npackai validate ./${basename(targetDir)}\n\n# Pack bundle\npackai pack ./${basename(targetDir)}\n\n# Provision onto any machine\npackai apply ./${manifest.name}-1.0.0.packai\n\`\`\`\n`;
  writeFileSync(join(targetDir, 'README.md'), readme, 'utf-8');

  // Output Report
  console.log(chalk.bold.green('✓ Pack successfully synthesized from existing workspace!'));
  console.log();
  log.item('Pack Level', level.toUpperCase());
  log.item('Base Rules', sourceRuleType || 'Generated default AGENTS.md');
  log.item('Agents Discovered', detectedAgents.length > 0 ? detectedAgents.map(a => a.id).join(', ') : 'None (single agent)');
  log.item('Agent Skills', detectedSkills.length > 0 ? detectedSkills.map(s => s.name).join(', ') : 'None');
  log.item('MCP Servers', Object.keys(detectedMcpServers).length > 0 ? Object.keys(detectedMcpServers).join(', ') : 'None');
  log.item('Binaries Required', Array.from(detectedBinaries).join(', ') || 'None');
  log.item('Secrets Detected', Array.from(detectedSecrets).join(', ') || 'None');
  if (detectedExecution) {
    log.item('Execution Command', chalk.cyan(detectedExecution.command));
  }
  console.log();
  log.dim('Next steps:');
  log.dim(`  1. cd ${basename(targetDir)}`);
  log.dim('  2. Review packai.yaml, AGENTS.md and mcp.json');
  log.dim('  3. packai validate .');
  log.dim('  4. packai pack .');
  console.log();
}

export async function initCommand(name, options = {}) {
  try {
    // If --from-existing is passed
    if (options.fromExisting) {
      const sourceDir = typeof options.fromExisting === 'string' ? options.fromExisting : '.';
      const targetName = name || `${basename(resolve(sourceDir))}-pack`;
      await initFromExisting(sourceDir, targetName, options);
      return;
    }

    if (!name) {
      log.error('Missing pack name. Usage: packai init <name> or packai init --from-existing [sourceDir]');
      process.exit(1);
    }

    const level = options.level || 'simple';
    const category = options.category || 'coding';

    if (!TEMPLATES[level]) {
      log.error(`Unknown level: "${level}". Supported: simple, enhanced, system`);
      process.exit(1);
    }

    const dir = resolve(name);

    if (existsSync(dir)) {
      log.error(`Directory "${name}" already exists.`);
      process.exit(1);
    }

    const template = TEMPLATES[level];

    // Create root directory
    mkdirSync(dir, { recursive: true });

    // Create subdirectories
    for (const subdir of template.dirs) {
      mkdirSync(join(dir, subdir), { recursive: true });
    }

    // Create manifest
    const manifest = template.manifest(name, category);
    // Write packai.yaml
    writeFileSync(
      join(dir, 'packai.yaml'),
      YAML.stringify(manifest),
      'utf-8'
    );
    // Also write manifest.json for backwards compatibility
    writeFileSync(
      join(dir, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
      'utf-8'
    );

    // Create template files
    for (const file of template.files) {
      writeFileSync(join(dir, file.path), file.content, 'utf-8');
    }

    // Create README
    const readme = `# ${name}\n\n${manifest.description}\n\n## Usage\n\n\`\`\`bash\n# Validate the pack\npackai validate ./${name}\n\n# Pack bundle\npackai pack ./${name}\n\n# Export for Cursor\npackai export ./${name} --target cursor\n\n# Export for Claude\npackai export ./${name} --target claude\n\`\`\`\n\n## Level\n\n${level}\n\n## License\n\nMIT\n`;
    writeFileSync(join(dir, 'README.md'), readme, 'utf-8');

    log.heading('PackAI created!');
    log.item('Name', name);
    log.item('Level', level);
    log.item('Category', category);
    log.item('Path', dir);
    console.log();
    log.dim('Next steps:');
    log.dim(`  1. cd ${name}`);
    log.dim('  2. Edit packai.yaml and AGENTS.md');
    log.dim('  3. packai validate .');
    log.dim('  4. packai pack .');
    console.log();
    log.success('Happy packing! 📦');

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
