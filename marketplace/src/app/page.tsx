import Link from 'next/link';

const CATEGORIES = [
  { name: 'Coding', slug: 'coding', icon: '💻', count: 0 },
  { name: 'Writing', slug: 'writing', icon: '✍️', count: 0 },
  { name: 'Business', slug: 'business', icon: '📊', count: 0 },
  { name: 'Legal', slug: 'legal', icon: '⚖️', count: 0 },
  { name: 'Education', slug: 'education', icon: '🎓', count: 0 },
  { name: 'Marketing', slug: 'marketing', icon: '📢', count: 0 },
  { name: 'Data', slug: 'data', icon: '📈', count: 0 },
  { name: 'Design', slug: 'design', icon: '🎨', count: 0 },
  { name: 'Finance', slug: 'finance', icon: '💰', count: 0 },
  { name: 'Support', slug: 'support', icon: '🎧', count: 0 },
];

const FEATURED_PACKS = [
  {
    name: 'senior-go-backend',
    displayName: 'Senior Go Backend',
    description: 'Idiomatic Go, DDD, clean architecture, and strict testing rules for backend development.',
    category: 'coding',
    level: 'simple',
    author: 'hatred',
    downloads: 1247,
    rating: 4.8,
    tags: ['go', 'backend', 'ddd'],
  },
  {
    name: 'turkish-tax-advisor',
    displayName: 'Turkish Tax Advisor',
    description: 'Türk vergi mevzuatı uzmanı. KDV, Gelir Vergisi, Kurumlar Vergisi danışmanlığı.',
    category: 'finance',
    level: 'enhanced',
    author: 'vergi_ustasi',
    downloads: 832,
    rating: 4.6,
    tags: ['vergi', 'tax', 'turkey'],
  },
  {
    name: 'ecommerce-support-system',
    displayName: 'E-Commerce Support System',
    description: 'Multi-agent customer support: auto-routing, refund handling, and product expertise.',
    category: 'support',
    level: 'system',
    author: 'hatred',
    downloads: 2103,
    rating: 4.9,
    tags: ['multi-agent', 'shopify', 'support'],
  },
  {
    name: 'react-ts-architect',
    displayName: 'React TypeScript Architect',
    description: 'Senior React/TypeScript engineer with Next.js, Zustand, and testing best practices.',
    category: 'coding',
    level: 'simple',
    author: 'frontend_pro',
    downloads: 3891,
    rating: 4.7,
    tags: ['react', 'typescript', 'nextjs'],
  },
  {
    name: 'content-writer-pro',
    displayName: 'Content Writer Pro',
    description: 'SEO-optimized blog writer with tone control, keyword integration, and readability scoring.',
    category: 'writing',
    level: 'enhanced',
    author: 'wordsmith',
    downloads: 1563,
    rating: 4.5,
    tags: ['seo', 'blog', 'content'],
  },
  {
    name: 'fullstack-saas-team',
    displayName: 'Full-Stack SaaS Team',
    description: '4-agent system: architect, frontend dev, backend dev, and code reviewer working together.',
    category: 'coding',
    level: 'system',
    author: 'saas_builder',
    downloads: 967,
    rating: 4.9,
    tags: ['saas', 'multi-agent', 'fullstack'],
  },
];

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    simple: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    enhanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    system: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || ''}`}>
      {level}
    </span>
  );
}

function PackCard({ pack }: { pack: (typeof FEATURED_PACKS)[0] }) {
  return (
    <Link
      href={`/pack/${pack.name}`}
      className="block border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pack.displayName}</h3>
        <LevelBadge level={pack.level} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{pack.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {pack.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>by @{pack.author}</span>
        <div className="flex items-center gap-3">
          <span>⬇ {pack.downloads.toLocaleString()}</span>
          <span>★ {pack.rating}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">AIPack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Browse
            </Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Docs
            </Link>
            <Link
              href="/login"
              className="text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              Sign in with GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
          AI Systems,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Packaged.
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Discover, share, and install complete AI configurations — from simple personas to multi-agent architectures. One format, every platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <div className="bg-gray-900 dark:bg-gray-700 text-green-400 px-6 py-3 rounded-lg font-mono text-sm">
            npx aipack install senior-go-backend
          </div>
          <Link
            href="/browse"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Browse Packs →
          </Link>
        </div>
        <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>✓ Cursor</span>
          <span>✓ Claude</span>
          <span>✓ ChatGPT</span>
          <span>✓ Open Source</span>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Discover</h3>
            <p className="text-gray-600 dark:text-gray-400">Browse curated AI packs built by the community — from coding assistants to multi-agent systems.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Install</h3>
            <p className="text-gray-600 dark:text-gray-400">One command or one click. Export to Cursor, Claude, ChatGPT, or download the raw .aipack file.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Use</h3>
            <p className="text-gray-600 dark:text-gray-400">Your AI instantly transforms. New persona, new rules, new capabilities — all configured and ready.</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:shadow-md transition bg-white dark:bg-gray-800"
            >
              <span className="text-3xl mb-2">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Packs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Packs</h2>
          <Link href="/browse" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_PACKS.map((pack) => (
            <PackCard key={pack.name} pack={pack} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Build & Share Your Own Pack</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Package your AI expertise and share it with the world. Create packs from simple personas to complete multi-agent systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-mono text-sm">
              npx aipack init my-awesome-pack
            </div>
            <Link
              href="/docs/getting-started"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><Link href="/browse" className="hover:text-gray-900 dark:hover:text-white">Browse Packs</Link></p>
                <p><Link href="/docs" className="hover:text-gray-900 dark:hover:text-white">Documentation</Link></p>
                <p><Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Developers</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><Link href="/docs/format" className="hover:text-gray-900 dark:hover:text-white">Format Spec</Link></p>
                <p><Link href="/docs/cli" className="hover:text-gray-900 dark:hover:text-white">CLI Reference</Link></p>
                <p><a href="https://github.com/aipack" className="hover:text-gray-900 dark:hover:text-white">GitHub</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Community</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><a href="https://discord.gg/aipack" className="hover:text-gray-900 dark:hover:text-white">Discord</a></p>
                <p><a href="https://twitter.com/aipack" className="hover:text-gray-900 dark:hover:text-white">Twitter / X</a></p>
                <p><Link href="/blog" className="hover:text-gray-900 dark:hover:text-white">Blog</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</Link></p>
                <p><Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms</Link></p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 AIPack. Open format, open source CLI. Built for the AI community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
