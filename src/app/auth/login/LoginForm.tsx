'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [loading, setLoading] = useState<'kakao' | 'google' | null>(null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  const supabase = createClient()

  async function signInWith(provider: 'kakao' | 'google') {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) {
      console.error(error)
      setLoading(null)
    }
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h2 className="text-xl font-semibold text-[#2C2417] mb-2 text-center">로그인</h2>
      <p className="text-sm text-[#A88B63] text-center mb-8">
        소셜 계정으로 간편하게 시작하세요
      </p>

      {error === 'oauth_failed' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
          로그인에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* 카카오 로그인 */}
        <button
          onClick={() => signInWith('kakao')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#FEE500', color: '#3C1E1E' }}
        >
          {loading === 'kakao' ? (
            <span className="inline-block w-5 h-5 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
              <path d="M12 3C6.477 3 2 6.477 2 10.77c0 2.716 1.612 5.102 4.052 6.534L5.04 21l4.61-2.877C10.382 18.353 11.178 18.5 12 18.5c5.523 0 10-3.477 10-7.73C22 6.477 17.523 3 12 3z"/>
            </svg>
          )}
          카카오로 계속하기
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={() => signInWith('google')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border border-[#E0D0B8] bg-white font-medium text-[#2C2417] transition-all hover:bg-[#FBF7EF] active:scale-95 disabled:opacity-50"
        >
          {loading === 'google' ? (
            <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          구글로 계속하기
        </button>
      </div>

      <p className="text-xs text-[#C9B99A] text-center mt-6 leading-relaxed">
        로그인 시 <span className="underline cursor-pointer">이용약관</span>과{' '}
        <span className="underline cursor-pointer">개인정보처리방침</span>에 동의하게 됩니다.
      </p>
    </div>
  )
}
