import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { log } from '../utils/logger.js';

const TEMPLATES = {
  simple: {
    manifest: (name, category) => ({
      spec_version: '1.0',
      name,
      version: '1.0.0',
      description: `A ${category} AI assistant pack`,
      author: { name: 'your-name', github: 'your-github' },
      level: 'simple',
      category,
      tags: [],
      language: 'en',
      persona: {
        role: 'AI Assistant',
        tone: 'Helpful, clear, concise',
        expertise: [],
        instructions: 'You are a helpful AI assistant. Customize this prompt to define your AI\'s behavior.',
      },
      rules: {
        items: [
          'Always be accurate and honest',
          'If unsure, say so rather than guessing',
        ],
      },
    }),
    dirs: [],
    files: [],
  },

  enhanced: {
    manifest: (name, category) => ({
      spec_version: '1.0',
      name,
      version: '1.0.0',
      description: `An enhanced ${category} AI assistant with tools and knowledge`,
      author: { name: 'your-name', github: 'your-github' },
      level: 'enhanced',
      category,
      tags: [],
      language: 'en',
      persona: {
        file: './persona/system.md',
      },
      rules: {
        file: './rules/rules.md',
      },
      knowledge: [
        {
          name: 'reference-docs',
          description: 'Reference documentation',
          type: 'embedded',
          path: './knowledge/reference.md',
          format: 'markdown',
        },
      ],
      tools: {
        mcp_servers: [],
      },
    }),
    dirs: ['persona', 'rules', 'knowledge'],
    files: [
      {
        path: 'persona/system.md',
        content: '# System Prompt\n\nYou are a helpful AI assistant.\n\nCustomize this file to define your AI\'s identity, tone, and behavior.\n',
      },
      {
        path: 'rules/rules.md',
        content: '# Rules\n\n- Always be accurate and honest\n- If unsure, say so rather than guessing\n- Add your own rules here\n',
      },
      {
        path: 'knowledge/reference.md',
        content: '# Reference Knowledge\n\nAdd your reference documentation here.\n\nThis content will be included in the AI\'s context when exported.\n',
      },
    ],
  },

  system: {
    manifest: (name, category) => ({
      spec_version: '1.0',
      name,
      version: '1.0.0',
      description: `A multi-agent ${category} AI system`,
      author: { name: 'your-name', github: 'your-github' },
      level: 'system',
      category,
      tags: [],
      language: 'en',
      persona: {
        file: './persona/system.md',
      },
      rules: {
        file: './rules/rules.md',
      },
      knowledge: [
        {
          name: 'shared-knowledge',
          description: 'Shared knowledge base for all agents',
          type: 'embedded',
          path: './knowledge/shared.md',
          format: 'markdown',
        },
      ],
      tools: {
        mcp_servers: [],
      },
      agents: [
        {
          id: 'router',
          name: 'Router',
          description: 'Routes incoming messages to the appropriate agent',
          model_preference: 'fast',
          persona: { file: './agents/router/system.md' },
          rules: {
            items: [
              'Only route messages, do not answer questions directly',
              'If uncertain, ask the user for clarification',
            ],
          },
        },
        {
          id: 'specialist',
          name: 'Specialist',
          description: 'Handles specialized tasks',
          model_preference: 'smart',
          persona: { file: './agents/specialist/system.md' },
          knowledge: [{ ref: 'shared-knowledge' }],
        },
      ],
      workflow: {
        entry: 'router',
        routes: [
          { from: 'router', to: 'specialist', condition: "intent == 'specialized_task'" },
          { from: 'router', to: 'router', condition: 'default', fallback: true },
        ],
        shared_context: {
          pass_conversation_history: true,
          max_history_messages: 20,
        },
      },
      requirements: {
        platform: {
          os: ['darwin', 'linux', 'win32'],
          min_ram_gb: 8,
        },
        binaries: [],
        services: [],
        secrets: [],
      },
    }),
    dirs: ['persona', 'rules', 'knowledge', 'agents/router', 'agents/specialist'],
    files: [
      {
        path: 'persona/system.md',
        content: '# System Prompt\n\nYou are the primary AI in a multi-agent system.\n\nCustomize this file.\n',
      },
      {
        path: 'rules/rules.md',
        content: '# Rules\n\n- Always be accurate and honest\n- Coordinate with other agents when needed\n',
      },
      {
        path: 'knowledge/shared.md',
        content: '# Shared Knowledge\n\nAdd knowledge that all agents should have access to.\n',
      },
      {
        path: 'agents/router/system.md',
        content: '# Router Agent\n\nYou are a routing agent. Analyze incoming messages and route them to the appropriate specialist agent.\n\nDo not answer questions directly — only classify and route.\n',
      },
      {
        path: 'agents/specialist/system.md',
        content: '# Specialist Agent\n\nYou are a specialist agent that handles specific tasks.\n\nCustomize this prompt for your use case.\n',
      },
    ],
  },
};

export async function initCommand(name, options) {
  try {
    const level = options.level || 'simple';
    const category = options.category || 'other';

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
    const readme = `# ${name}\n\n${manifest.description}\n\n## Usage\n\n\`\`\`bash\n# Validate the pack\naipack validate ./${name}\n\n# Export for Cursor\naipack export ./${name} --target cursor\n\n# Export for Claude\naipack export ./${name} --target claude\n\`\`\`\n\n## Level\n\n${level}\n\n## License\n\nMIT\n`;
    writeFileSync(join(dir, 'README.md'), readme, 'utf-8');

    log.heading('AIPack created!');
    log.item('Name', name);
    log.item('Level', level);
    log.item('Category', category);
    log.item('Path', dir);
    console.log();
    log.dim('Next steps:');
    log.dim(`  1. cd ${name}`);
    log.dim('  2. Edit manifest.json and persona files');
    log.dim('  3. aipack validate .');
    log.dim('  4. aipack export . --target cursor');
    console.log();
    log.success('Happy packing! 📦');

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
