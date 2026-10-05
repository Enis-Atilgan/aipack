import Link from 'next/link';

// Mock data - will be replaced with Supabase
const MOCK_PACKS: Record<string, {
  name: string;
  displayName: string;
  description: string;
  category: string;
  level: string;
  author: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  version: string;
  license: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  readme: string;
  manifest: object;
}> = {
  'senior-go-backend': {
    name: 'senior-go-backend',
    displayName: 'Senior Go Backend',
    description: 'Idiomatic Go, DDD, clean architecture, and strict testing rules for backend development.',
    category: 'coding',
    level: 'simple',
    author: 'hatred',
    downloads: 1247,
    rating: 4.8,
    ratingCount: 89,
    tags: ['go', 'golang', 'backend', 'ddd', 'clean-architecture'],
    version: '1.0.0',
    license: 'MIT',
    language: 'en',
    createdAt: '2026-08-15',
    updatedAt: '2026-09-28',
    readme: `# Senior Go Backend\n\nA comprehensive AI configuration pack for Go backend development.\n\n## What's included\n\n- **Persona**: Senior Go engineer with 10+ years of experience\n- **Rules**: 6 strict coding rules for idiomatic Go\n- **Focus areas**: DDD, clean architecture, table-driven tests\n\n## Usage\n\n\`\`\`bash\naipack install senior-go-backend\naipack export . --target cursor\n\`\`\`\n\n## Rules\n\n1. Always prefer stdlib over third-party packages\n2. Never use panic() for error handling\n3. Use table-driven tests for all public functions\n4. Context must be the first parameter for I/O functions\n5. All SQL must use parameterized queries\n6. Options struct for functions with 3+ parameters`,
    manifest: {
      spec_version: '1.0',
      name: 'senior-go-backend',
      version: '1.0.0',
      level: 'simple',
      persona: {
        role: 'Senior Go Backend Engineer',
        tone: 'Direct, concise, opinionated',
      },
      rules: {
        items: [
          'Always prefer stdlib over third-party packages',
          'Never use panic() for error handling',
          'Use table-driven tests',
        ],
      },
    },
  },
};

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    simple: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    enhanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    system: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[level] || ''}`}>
      {level}
    </span>
  );
}

export default async function PackDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const pack = MOCK_PACKS[name];

  if (!pack) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">📦</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pack not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The pack "{name}" doesn't exist or has been removed.</p>
          <Link href="/browse" className="text-blue-600 hover:text-blue-700 font-medium">← Browse all packs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">AIPack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm text-gray-600 dark:text-gray-300">Browse</Link>
            <Link href="/login" className="text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/browse" className="hover:text-gray-700 dark:hover:text-gray-200">Browse</Link>
          <span className="mx-2">/</span>
          <Link href={`/browse?category=${pack.category}`} className="hover:text-gray-700 dark:hover:text-gray-200 capitalize">{pack.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{pack.displayName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{pack.displayName}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">{pack.description}</p>
              </div>
              <LevelBadge level={pack.level} />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {pack.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>

            {/* Install buttons */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Install</h3>
              <div className="bg-gray-900 text-green-400 px-4 py-3 rounded-lg font-mono text-sm mb-4">
                npx aipack install {pack.name}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  ⬇ Download for Cursor
                </button>
                <button className="px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition">
                  ⬇ Download for Claude
                </button>
                <button className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  ⬇ Download for ChatGPT
                </button>
              </div>
            </div>

            {/* README */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">README</h3>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{pack.readme}</pre>
              </div>
            </div>

            {/* Manifest preview */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">manifest.json</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(pack.manifest, null, 2)}
              </pre>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4 sticky top-8">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">@{pack.author}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pack.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Downloads</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">⬇ {pack.downloads.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">★ {pack.rating} ({pack.ratingCount} reviews)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">License</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pack.license}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pack.language}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pack.updatedAt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pack.createdAt}</p>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                ⭐ Rate this pack
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                🚩 Report
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
