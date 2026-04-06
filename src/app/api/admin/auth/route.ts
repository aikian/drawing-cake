import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { pin } = await request.json()

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN을 입력해주세요.' }, { status: 400 })
  }

  const adminPin = process.env.ADMIN_PIN
  if (!adminPin) {
    console.error('ADMIN_PIN 환경변수가 설정되지 않았습니다.')
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
  }

  if (pin !== adminPin) {
    return NextResponse.json({ error: 'PIN이 올바르지 않습니다.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  })

  return response
}
