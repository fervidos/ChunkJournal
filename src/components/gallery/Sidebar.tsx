'use client'

import Link from 'next/link'

interface Props {
  worlds: { id: string; name: string; slug: string; _count?: { screenshots: number } }[]
  tags: { id: string; name: string }[]
  activeWorld: string | null
  activeTag: string | null
  search: string
  total: number
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
  onWorldChange,
  onTagChange,
  onSearchChange,
}: Props) {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col gap-6 p-5 overflow-y-auto opacity-0 animate-[fadeIn_0.5s_ease_0.1s_forwards]">
      <div>
        <h1 className="font-[family-name:var(--font-sans)] text-xl font-semibold tracking-tight">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <span className="text-[var(--color-accent)]">Chunk</span>Journal
          </Link>
        </h1>
      </div>

      <div>
        <label className="text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)] block mb-2">
          Worlds
        </label>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={() => onWorldChange(null)}
            className={`text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              activeWorld === null
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)]'
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
              className={`text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                activeWorld === w.slug
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)]'
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
            className={`text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              activeTag === null
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
            }`}
          >
            All tags
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => onTagChange(t.name)}
              className={`text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                activeTag === t.name
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent)]'
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
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>
    </aside>
  )
}
