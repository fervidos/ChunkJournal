'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ token: password }),
      })
      if (!res.ok) {
        setError('Wrong password')
        return
      }
      sessionStorage.setItem('chunkjournal_token', password)
      router.push('/')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-bg)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80 p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
      >
        <h1 className="text-xl font-semibold tracking-tight">
          <span className="text-[var(--color-accent)]">Chunk</span>Journal
        </h1>
        <p className="text-xs text-[var(--color-text-dim)]">Enter the admin password to manage screenshots.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-black font-medium text-sm hover:bg-[var(--color-accent-dim)] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
