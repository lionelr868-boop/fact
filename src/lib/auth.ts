import { db } from '@/lib/db'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  wilaya: string | null
  areaHectares: number | null
  productionType: string | null
}

export function generateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() }), 'utf-8').toString('base64')
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (decoded.userId) {
      return { userId: decoded.userId }
    }
    return null
  } catch {
    return null
  }
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
  })

  if (!user) return null
  if (user.frozen) return null // Frozen accounts cannot access

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    wilaya: user.wilaya,
    areaHectares: user.areaHectares,
    productionType: user.productionType,
  }
}
