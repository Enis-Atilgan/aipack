'use client';

import Link from 'next/link';
import { useState } from 'react';

const CATEGORIES = [
  { name: 'All', slug: 'all' },
  { name: 'Coding', slug: 'coding' },
  { name: 'Writing', slug: 'writing' },
  { name: 'Business', slug: 'business' },
  { name: 'Legal', slug: 'legal' },
  { name: 'Education', slug: 'education' },
  { name: 'Marketing', slug: 'marketing' },
  { name: 'Data', slug: 'data' },
  { name: 'Design', slug: 'design' },
  { name: 'Finance', slug: 'finance' },
  { name: 'Support', slug: 'support' },
];

const SORT_OPTIONS = [
  { name: 'Most Downloaded', value: 'downloads' },
  { name: 'Highest Rated', value: 'rating' },
  { name: 'Newest', value: 'newest' },
];

// Mock data - will be replaced with Supabase queries
const MOCK_PACKS = [
  {
    name: 'senior-go-backend',
    displayName: 'Senior Go Backend',
    description: 'Idiomatic Go, DDD, clean architecture, and strict testing rules.',
    category: 'coding',
    level: 'simple' as const,
    author: 'hatred',
    downloads: 1247,
    rating: 4.8,
    tags: ['go', 'backend', 'ddd'],
  },
  {
    name: 'react-ts-architect',
    displayName: 'React TypeScript Architect',
    description: 'Senior React/TypeScript engineer with Next.js and testing best practices.',
    category: 'coding',
    level: 'simple' as const,
    author: 'frontend_pro',
    downloads: 3891,
    rating: 4.7,
    tags: ['react', 'typescript', 'nextjs'],
  },
  {
    name: 'turkish-tax-advisor',
    displayName: 'Turkish Tax Advisor',
    description: 'Türk vergi mevzuatı uzmanı. KDV, Gelir Vergisi, Kurumlar Vergisi.',
    category: 'finance',
    level: 'enhanced' as const,
    author: 'vergi_ustasi',
    downloads: 832,
    rating: 4.6,
    tags: ['vergi', 'tax', 'turkey'],
  },
  {
    name: 'ecommerce-support-system',
    displayName: 'E-Commerce Support System',
    description: 'Multi-agent customer support: auto-routing, refund handling, product expertise.',
    category: 'support',
    level: 'system' as const,
    author: 'hatred',
    downloads: 2103,
    rating: 4.9,
    tags: ['multi-agent', 'shopify', 'support'],
  },
  {
    name: 'content-writer-pro',
    displayName: 'Content Writer Pro',
    description: 'SEO-optimized blog writer with tone control and readability scoring.',
    category: 'writing',
    level: 'enhanced' as const,
    author: 'wordsmith',
    downloads: 1563,
    rating: 4.5,
    tags: ['seo', 'blog', 'content'],
  },
  {
    name: 'fullstack-saas-team',
    displayName: 'Full-Stack SaaS Team',
    description: '4-agent system: architect, frontend, backend, reviewer working together.',
    category: 'coding',
    level: 'system' as const,
    author: 'saas_builder',
    downloads: 967,
    rating: 4.9,
    tags: ['saas', 'multi-agent', 'fullstack'],
  },
  {
    name: 'legal-contract-drafter',
    displayName: 'Legal Contract Drafter',
    description: 'Draft and review legal contracts with jurisdiction-aware clause suggestions.',
    category: 'legal',
    level: 'enhanced' as const,
    author: 'lawtech',
    downloads: 445,
    rating: 4.4,
    tags: ['contracts', 'legal', 'drafting'],
  },
  {
    name: 'python-data-scientist',
    displayName: 'Python Data Scientist',
    description: 'Pandas, scikit-learn, matplotlib expert with clean notebook practices.',
    category: 'data',
    level: 'simple' as const,
    author: 'data_guru',
    downloads: 2340,
    rating: 4.6,
    tags: ['python', 'pandas', 'ml'],
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

export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('downloads');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPacks = MOCK_PACKS
    .filter((pack) => {
      if (selectedCategory !== 'all' && pack.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          pack.name.includes(q) ||
          pack.displayName.toLowerCase().includes(q) ||
          pack.description.toLowerCase().includes(q) ||
          pack.tags.some((t) => t.includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // newest would use created_at
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">AIPack</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm font-medium text-gray-900 dark:text-white">
              Browse
            </Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Docs
            </Link>
            <Link
              href="/login"
              className="text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search packs... (e.g. 'go backend', 'multi-agent', 'react')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-8">
              Level
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded" defaultChecked /> Simple
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded" defaultChecked /> Enhanced
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded" defaultChecked /> System
              </label>
            </div>
          </aside>

          {/* Pack Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPacks.length} pack{filteredPacks.length !== 1 ? 's' : ''} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPacks.map((pack) => (
                <Link
                  key={pack.name}
                  href={`/pack/${pack.name}`}
                  className="block border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{pack.displayName}</h3>
                    <LevelBadge level={pack.level} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{pack.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pack.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>@{pack.author}</span>
                    <div className="flex items-center gap-3">
                      <span>⬇ {pack.downloads.toLocaleString()}</span>
                      <span>★ {pack.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPacks.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-600 dark:text-gray-400">No packs found. Try a different search or category.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
