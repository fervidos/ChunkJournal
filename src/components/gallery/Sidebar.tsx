'use client'

import Link from 'next/link'

interface Props {
  worlds: { id: string; name: string; slug: string; _count?: { screenshots: number } }[]
  tags: { id: string; name: string }[]
  activeWorld: string | null
  activeTag: string | null
  search: string
  total: number
  onClose: () => void
  onWorldChange: (slug: string | null) => void
  onTagChange: (name: string | null) => void
  onSearchChange: (q: string) => void
}

export default function Sidebar({
  worlds,
  tags,
  activeWorld,
  activeTag,
  search,
  total,
  onClose,
  onWorldChange,
  onTagChange,
  onSearchChange,
}: Props) {
  return (
    <aside className="w-full h-full flex-shrink-0 border-r border-[#25211e] bg-[#0f0e0d] flex flex-col gap-6 p-5 overflow-y-auto opacity-0 animate-[fadeIn_0.5s_ease_0.1s_forwards]">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-sans)] text-xl font-semibold tracking-tight">
          <Link href="/" onClick={onClose} className="hover:opacity-80 transition-opacity">
            <span className="text-[var(--color-accent)]">Chunk</span>Journal
          </Link>
        </h1>
        <button
          onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Close filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label className="text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)] block mb-2">
          Worlds
        </label>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={() => onWorldChange(null)}
            className={`text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${
              activeWorld === null
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)] border border-[var(--color-border)]'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
            }`}
          >
            All worlds
            <span className="text-[var(--color-text-muted)] text-xs ml-1.5">
              {total}
            </span>
          </button>
          {worlds.map((w) => (
            <button
              key={w.id}
              onClick={() => onWorldChange(w.slug)}
              className={`text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                activeWorld === w.slug
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
              }`}
            >
              {w.name}
              <span className="text-[var(--color-text-muted)] text-xs ml-1.5">
                {w._count?.screenshots ?? 0}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        <label className="text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)] block mb-2">
          Tags
        </label>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={() => onTagChange(null)}
            className={`text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${
              activeTag === null
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)] border border-[var(--color-border)]'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
            }`}
          >
            All tags
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => onTagChange(t.name)}
              className={`text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                activeTag === t.name
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        <input
          type="search"
          placeholder="Search screenshots…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#25211e] bg-[#1a1816] text-sm text-[#f2ede6] outline-none placeholder:text-[#8d847a] transition-colors focus:border-[#a9b998]"
        />
      </div>
    </aside>
  )
}
