import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ valid: false }, { status: 401 })
  }
  return Response.json({ valid: true })
}
