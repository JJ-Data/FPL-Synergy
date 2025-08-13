import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin', '1', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return res
}
