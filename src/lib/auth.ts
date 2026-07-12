import { NextRequest } from 'next/server'

export function requireAdmin(req: NextRequest): Response | null {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('chunkjournal_token')
}

export function setClientToken(token: string) {
  sessionStorage.setItem('chunkjournal_token', token)
}

export function clearClientToken() {
  sessionStorage.removeItem('chunkjournal_token')
}
