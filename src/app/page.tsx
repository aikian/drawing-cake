import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const hour = kst.getHours()
  const isOpen = hour >= 11 && hour < 20

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E0D0B8]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎂</span>
            <span className="font-bold text-[#5C4A30] text-lg">드로잉케이크</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/mypage" className="text-sm text-[#8B6F47] hover:text-[#5C4A30] transition-colors">
                  마이페이지
                </Link>
                <Link
                  href="/order"
                  className="btn-primary text-sm px-5 py-2"
                >
                  주문하기
                </Link>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-outline text-sm px-5 py-2">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden flex-1">
        {/* 배경 그라데이션 */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, #F5EDD8 0%, #FBF7EF 50%, #FDFAF6 100%)',
          }}
        />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full -z-10"
             style={{ background: 'radial-gradient(circle, #F2C4BE22 0%, transparent 70%)' }} />

        <div className="max-w-5xl mx-auto px-4 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* 텍스트 */}
            <div className="flex-1 text-center lg:text-left">
              {/* 영업 상태 */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${
                isOpen
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isOpen ? '지금 주문 가능 · 11:00~20:00' : '영업 준비 중 · 11:00 오픈'}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-[#2C2417] leading-tight mb-4">
                AI로 그리는<br />
                <span style={{ color: '#8B6F47' }}>나만의 케이크</span>
              </h1>
              <p className="text-[#8B6F47] text-lg mb-8 leading-relaxed">
                원하는 이미지를 AI로 생성하거나 직접 그려서<br className="hidden lg:block" />
                케이크·도넛에 즉석으로 인쇄해드려요.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href={isOpen ? '/order' : '#'}
                  className={`btn-primary text-base px-8 py-4 ${!isOpen && 'opacity-50 pointer-events-none'}`}
                >
                  지금 주문하기 →
                </Link>
                <Link href="/design?type=cake" className="btn-secondary text-base px-8 py-4">
                  디자인 미리보기
                </Link>
              </div>
            </div>

            {/* 일러스트 */}
            <div className="flex-shrink-0 relative">
              <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-[#F5EDD8] to-[#E8D9C0] flex items-center justify-center shadow-xl">
                <span className="text-8xl lg:text-9xl">🎂</span>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#F2C4BE] flex items-center justify-center text-2xl shadow-lg animate-bounce">
                ✨
              </div>
              <div className="absolute -bottom-2 -left-4 w-14 h-14 rounded-full bg-[#E8D9C0] flex items-center justify-center text-xl shadow-lg">
                🍩
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 상품 카드 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-[#2C2417] text-center mb-2">메뉴</h2>
        <p className="text-[#A88B63] text-center mb-10">모든 상품은 당일 신선 제조됩니다</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '🎂', name: '커스텀 케이크 (9cm)', price: '22,000', desc: 'AI 또는 직접 그린 이미지를 케이크 위에 인쇄', tag: '베스트' },
            { emoji: '🍩', name: '커스텀 도넛', price: '6,000', desc: '내 디자인이 담긴 세상에 하나뿐인 도넛', tag: null },
            { emoji: '🍩×4', name: '도넛 4개 세트', price: '20,000', desc: '4가지 디자인을 각각 다르게 설정 가능', tag: '세트 할인' },
          ].map(item => (
            <Link
              key={item.name}
              href={`/order?product=${encodeURIComponent(item.name)}`}
              className="card p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{item.emoji}</span>
                {item.tag && (
                  <span className="text-xs bg-[#F5EDD8] text-[#8B6F47] px-2 py-0.5 rounded-full font-medium">
                    {item.tag}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[#2C2417] mb-1">{item.name}</h3>
              <p className="text-sm text-[#A88B63] mb-3">{item.desc}</p>
              <p className="text-xl font-bold text-[#8B6F47]">{item.price}원</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 프로세스 */}
      <section className="bg-[#F5EDD8] py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#2C2417] text-center mb-10">이렇게 만들어져요</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', emoji: '✏️', title: '디자인', desc: 'AI 생성 또는 직접 그리기' },
              { step: '02', emoji: '🛒', title: '주문 & 결제', desc: '픽업 또는 배달 선택' },
              { step: '03', emoji: '🖨', title: '즉석 인쇄', desc: '식용 잉크 프린터로 바로 인쇄' },
              { step: '04', emoji: '🎁', title: '완성!', desc: '세상에 하나뿐인 나만의 케이크' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl mx-auto mb-3">
                  {item.emoji}
                </div>
                <p className="text-xs text-[#C9B99A] font-mono mb-1">STEP {item.step}</p>
                <p className="font-semibold text-[#2C2417] mb-1">{item.title}</p>
                <p className="text-xs text-[#A88B63]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI 크레딧 안내 */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="card p-8 bg-gradient-to-br from-[#FBF7EF] to-[#F5EDD8] border-[#E8D9C0]">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="text-5xl">✨</div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-xl font-bold text-[#2C2417] mb-2">AI 크레딧 시스템</h3>
              <p className="text-[#8B6F47] mb-4">
                주문할 때마다 크레딧이 쌓여요! AI로 원하는 이미지를 자유롭게 생성하세요.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <span className="bg-white border border-[#E0D0B8] px-4 py-2 rounded-full text-sm text-[#5C4A30]">
                  🎂 주문 완료 +3 크레딧
                </span>
                <span className="bg-white border border-[#E0D0B8] px-4 py-2 rounded-full text-sm text-[#5C4A30]">
                  🌟 3만원↑ 주문 +3 보너스
                </span>
                <span className="bg-white border border-[#E0D0B8] px-4 py-2 rounded-full text-sm text-[#5C4A30]">
                  ✨ AI 생성 1회 -1 크레딧
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 매장 정보 */}
      <section className="bg-[#F5EDD8] py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#2C2417] mb-8">매장 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '📍', title: '위치', desc: '대구 남구 대명동\n명덕역~교대역 라인' },
              { emoji: '⏰', title: '영업시간', desc: '매일 11:00 ~ 20:00\n(재료 소진 시 조기 마감)' },
              { emoji: '📞', title: '연락처', desc: 'drawingcake.co.kr\n카카오톡 채널 문의' },
            ].map(info => (
              <div key={info.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-3">{info.emoji}</div>
                <p className="font-semibold text-[#2C2417] mb-2">{info.title}</p>
                <p className="text-sm text-[#A88B63] whitespace-pre-line">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-white border-t border-[#E0D0B8] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎂</span>
            <div>
              <p className="font-semibold text-[#5C4A30] text-sm">드로잉케이크</p>
              <p className="text-xs text-[#C9B99A]">ArTec Studio · 알텍 스튜디오</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#C9B99A]">
            <a href="#" className="hover:text-[#8B6F47] transition-colors">이용약관</a>
            <a href="#" className="hover:text-[#8B6F47] transition-colors">개인정보처리방침</a>
            {/* 숨겨진 관리자 접근 */}
            <a href="/admin" className="hover:text-[#8B6F47] transition-colors opacity-30 hover:opacity-100">···</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
