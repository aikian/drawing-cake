# 드로잉케이크 개발 진행 기록
> 마지막 업데이트: 2026-04-06

---

## 현재 배포 상태

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/aikian/drawing-cake |
| Vercel | https://drawing-cake.vercel.app |
| Supabase | https://supabase.com/dashboard/project/xkfvbnwckwdntduecils |
| 최신 커밋 | `4b1407f` |

---

## 완료된 작업

### 환경 설정
- [x] Next.js 16.2.2 (App Router, TypeScript, Tailwind CSS)
- [x] 패키지 설치: `fabric`, `qrcode`, `@types/qrcode`, `@tosspayments/payment-sdk`, `@google/generative-ai`, `@supabase/supabase-js`, `@supabase/ssr`
- [x] Vercel 배포 연결 (GitHub 자동 배포)
- [x] Vercel 환경변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PIN`
- [x] `.npmrc` — `legacy-peer-deps=true`
- [x] Next.js 16 proxy 마이그레이션 (`middleware.ts` → `proxy.ts`, `export function proxy`)

### 브랜드 스타일
- [x] `globals.css` — 크림/베이지 컬러 시스템 (`--cream`, `--beige`, `--brown` 등)
- [x] 공통 컴포넌트 클래스: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.card`, `.input`
- [x] Noto Sans KR 폰트 적용
- [x] `layout.tsx` — SEO 메타데이터, OG 태그

### 인증 (Supabase Auth)
- [x] `src/proxy.ts` — 세션 자동 갱신, 보호 라우트 처리 (현재: `/mypage`만 보호)
- [x] `src/app/auth/callback/route.ts` — OAuth 콜백 처리
- [x] `src/app/auth/login/page.tsx` + `LoginForm.tsx` — 카카오/구글 소셜 로그인 UI
- [ ] Supabase Dashboard에서 카카오 Provider 활성화 (미완료)
- [ ] Supabase Dashboard에서 구글 Provider 활성화 (미완료)

### 페이지

#### `/` 랜딩 페이지 ✅
- 영업 상태 실시간 표시 (11:00~20:00 기준)
- 상품 카드 (케이크/도넛/세트)
- 주문 프로세스 4단계 안내
- AI 크레딧 시스템 소개
- 매장 정보 (대구 남구 대명동)
- 푸터 숨겨진 관리자 접근 버튼 (`···`)

#### `/order` 상품 선택 ✅
- 케이크 / 도넛 선택 카드
- 수량 선택 (1~10개)
- 실시간 합계 금액 계산
- 하단 고정 CTA → `/design` 이동

#### `/design` 디자인 캔버스 ✅
- Fabric.js 원형 캔버스 (400×400, 클리핑 처리)
- 도넛 선택 시 내부 가이드라인 표시
- **AI 생성 탭**: 프롬프트 입력 → `/api/ai/generate` 호출 → 캔버스 삽입
- **직접 그리기 탭**: PencilBrush, 색상/굵기 조절
- **이미지 업로드 탭**: 로컬 파일 → 캔버스 삽입
- 텍스트 추가: 폰트 5종, 색상, 크기 조절
- AI 크레딧 잔여량 표시
- 저장 → Supabase Storage 업로드 → `designs` 테이블 INSERT → `/checkout` 이동
- SSR 비활성화 (`dynamic import, ssr: false`)

#### `/checkout` 결제 ✅
- 디자인 썸네일 미리보기
- 픽업/배달 선택
  - 픽업: 날짜 선택 + 시간 선택 (30분 단위, 11:00~19:30)
  - 배달: 주소 입력
- 요청사항 텍스트
- 최종 금액 + 3만원↑ 보너스 크레딧 안내
- 결제: Toss 키 있으면 결제창, 없으면 바로 주문 생성 (테스트용)
- 주문 생성 → `orders` 테이블 INSERT
- 크레딧 적립 RPC 호출 (실패해도 주문 완료 처리)

#### `/complete` 주문 완료 ✅
- 주문번호 표시 (ID 앞 8자리)
- AI 크레딧 적립 내역 (+3, 3만원↑ 시 +6)
- 예상 준비 시간 안내 (15~20분)
- 추가 주문 / 홈으로 버튼

#### `/auth/login` 로그인 ✅
- 카카오 / 구글 소셜 로그인 버튼
- 에러 메시지 처리
- `next` 파라미터로 로그인 후 원래 페이지 복귀

#### `/admin` 관리자 대시보드 ✅
- PIN 4자리 인증 (환경변수 `ADMIN_PIN`, 서버에서 검증)
- 세션 저장 (`sessionStorage`, 24시간)
- Supabase Realtime 주문 실시간 감지
- 새 주문 알림음 재생
- 주문 카드: 썸네일, 고객명/전화, 상품/수량/금액, 픽업/배달 정보, 요청사항
- 상태 변경 버튼: 접수 → 제조 중 → 완료 → 배달 중 → 완료
- **QR 프린트 버튼**: 디자인 이미지 URL → QR 코드 생성 → 모달 표시 → EVEBOT 스캔
- 통계 요약: 신규/제조중/완료대기/전체
- 필터 탭: 전체/접수/제조중/완료/배달중

### API Routes

#### `POST /api/ai/generate` ✅
- 로그인 체크
- AI 크레딧 잔액 확인 (0이면 403)
- Gemini 2.0 Flash 이미지 생성
- Supabase Storage 업로드
- `deduct_ai_credit` RPC 호출
- `credit_history` 기록

#### `POST /api/payments/confirm` ✅
- Toss 결제 승인 API 호출
- `orders` 테이블 INSERT
- AI 크레딧 +3 적립
- 3만원↑ 보너스 크레딧 적립

#### `POST /api/admin/auth` ✅
- PIN 서버 검증 (`ADMIN_PIN` 환경변수)
- 성공 시 httpOnly 쿠키 발급 (24시간)

### 라이브러리 파일
- [x] `src/lib/supabase/client.ts` — 브라우저 클라이언트 (`createBrowserClient`)
- [x] `src/lib/supabase/server.ts` — 서버 클라이언트 (`createServerClient` + cookies)
- [x] `src/lib/gemini.ts` — Gemini 2.0 Flash 이미지 생성
- [x] `src/lib/qr.ts` — QR 코드 생성 (qrcode 라이브러리)
- [x] `src/lib/toss.ts` — Toss Payments 결제 승인

### Supabase
- [x] `supabase/migrations/001_initial_schema.sql` 작성 완료
- [ ] **SQL 실행 아직 안 함** → Supabase SQL Editor에서 실행 필요

---

## 남은 작업

### 🔴 즉시 필요 (서비스 동작을 위한 필수)

#### 1. Supabase SQL 마이그레이션 실행
→ https://supabase.com/dashboard/project/xkfvbnwckwdntduecils/sql/new

`supabase/migrations/001_initial_schema.sql` 전체 실행
- `users`, `designs`, `orders`, `ai_credits`, `credit_history` 테이블 생성
- RLS 정책 설정
- `deduct_ai_credit` 함수 (크레딧 원자적 차감)
- `handle_new_user` 트리거 (신규 가입 시 자동 처리)
- `designs` Storage 버킷 + 정책

#### 2. Supabase Auth — 카카오 설정
→ https://supabase.com/dashboard/project/xkfvbnwckwdntduecils/auth/providers

1. https://developers.kakao.com/console/app 에서 앱 생성
2. REST API 키 복사
3. 카카오 로그인 활성화 → Redirect URI: `https://xkfvbnwckwdntduecils.supabase.co/auth/v1/callback`
4. Supabase Kakao Provider에 Client ID/Secret 입력

#### 3. Supabase Auth — 구글 설정
→ https://supabase.com/dashboard/project/xkfvbnwckwdntduecils/auth/providers

1. https://console.cloud.google.com/apis/credentials 에서 OAuth 2.0 클라이언트 생성
2. 승인된 리디렉션 URI: `https://xkfvbnwckwdntduecils.supabase.co/auth/v1/callback`
3. Supabase Google Provider에 Client ID/Secret 입력

#### 4. Gemini API Key 설정
→ https://aistudio.google.com/app/apikey

Vercel 환경변수에 `GEMINI_API_KEY` 추가
→ https://vercel.com/0305adg-gmailcoms-projects/drawing-cake/settings/environment-variables

---

### 🟡 기능 완성 (서비스 품질)

#### 5. `/mypage` 마이페이지
- 주문 내역 탭: 썸네일 + 상태 + 재주문 버튼
- AI 크레딧 탭: 잔액, 적립/사용 내역, 만료일
- 디자인 보관함: 저장된 디자인 목록 (최대 10개, 초과 시 안내)
- 계정 설정: 이름, 전화번호, 기본 주소 수정

#### 6. Toss Payments 실결제 연동
→ https://developers.tosspayments.com/my/api-keys

Vercel 환경변수에 추가:
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- `TOSS_SECRET_KEY`

`/checkout/page.tsx`의 Toss SDK 결제창 호출 코드 완성

#### 7. `/api/orders/[id]/status` — 주문 상태 변경 API
관리자 대시보드에서 상태 변경 시 DB 업데이트 (현재 클라이언트에서 직접 supabase 호출 중, API로 분리 권장)

#### 8. `add_order_credits` Supabase 함수
`/checkout`에서 `supabase.rpc('add_order_credits', ...)` 호출 중인데 아직 DB 함수 미작성.
SQL Editor에서 추가 필요:

```sql
CREATE OR REPLACE FUNCTION public.add_order_credits(
  p_user_id uuid,
  p_order_id uuid,
  p_total_price int
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.ai_credits (user_id, balance, updated_at)
  VALUES (p_user_id, 3, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = ai_credits.balance + 3, updated_at = now();

  INSERT INTO public.credit_history (user_id, order_id, amount, reason, expires_at)
  VALUES (p_user_id, p_order_id, 3, 'order_reward',
          now() + interval '6 months');

  IF p_total_price >= 30000 THEN
    INSERT INTO public.ai_credits (user_id, balance, updated_at)
    VALUES (p_user_id, 3, now())
    ON CONFLICT (user_id) DO UPDATE
      SET balance = ai_credits.balance + 3, updated_at = now();

    INSERT INTO public.credit_history (user_id, order_id, amount, reason, expires_at)
    VALUES (p_user_id, p_order_id, 3, 'bonus_reward',
            now() + interval '6 months');
  END IF;
END;
$$;
```

---

### 🟢 추가 기능 (나중에)

#### 9. SMS 알림 (Aligo)
주문 완료 시 고객에게 SMS 발송
환경변수: `ALIGO_API_KEY`, `ALIGO_USER_ID`, `ALIGO_SENDER`

#### 10. `/admin/stats` 매출 통계
- 일별/월별 매출 차트
- 제품별 판매량
- AI 크레딧 사용 현황

#### 11. 디자인 보관함 10개 제한 처리
초과 시 가장 오래된 것 삭제 안내 로직

#### 12. 영업시간 외 주문 차단
현재 랜딩에서 버튼만 비활성화 → `/order` 진입 시에도 체크 추가

#### 13. Vercel 도메인 연결
`drawingcake.co.kr` 도메인 연결
→ https://vercel.com/0305adg-gmailcoms-projects/drawing-cake/settings/domains

---

## 파일 구조 (현재)

```
src/
├── app/
│   ├── page.tsx                    ✅ 랜딩
│   ├── layout.tsx                  ✅ 루트 레이아웃
│   ├── globals.css                 ✅ 브랜드 스타일
│   ├── order/page.tsx              ✅ 상품 선택
│   ├── design/
│   │   ├── page.tsx                ✅ (서버 래퍼)
│   │   └── DesignPageClient.tsx    ✅ 디자인 캔버스 페이지
│   ├── checkout/page.tsx           ✅ 결제
│   ├── complete/page.tsx           ✅ 주문 완료
│   ├── admin/
│   │   ├── page.tsx                ✅ (서버 래퍼)
│   │   ├── AdminLoader.tsx         ✅ (클라이언트 동적 로더)
│   │   └── AdminDashboard.tsx      ✅ 관리자 대시보드
│   ├── auth/
│   │   ├── login/
│   │   │   ├── page.tsx            ✅ 로그인 페이지
│   │   │   └── LoginForm.tsx       ✅ 로그인 폼
│   │   └── callback/route.ts       ✅ OAuth 콜백
│   ├── mypage/                     ❌ 미구현
│   └── api/
│       ├── ai/generate/route.ts    ✅ Gemini AI 생성
│       ├── payments/
│       │   └── confirm/route.ts    ✅ Toss 결제 승인
│       ├── admin/auth/route.ts     ✅ PIN 인증
│       └── orders/[id]/status/     ❌ 미구현
├── components/
│   ├── canvas/
│   │   └── DesignCanvas.tsx        ✅ Fabric.js 캔버스
│   └── admin/
│       ├── OrderCard.tsx           ✅ 주문 카드
│       └── QRModal.tsx             ✅ QR 코드 모달
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ✅ 브라우저 클라이언트
│   │   └── server.ts               ✅ 서버 클라이언트
│   ├── gemini.ts                   ✅ Gemini API
│   ├── qr.ts                       ✅ QR 코드 생성
│   └── toss.ts                     ✅ Toss Payments
└── proxy.ts                        ✅ Next.js 16 미들웨어

supabase/
└── migrations/
    └── 001_initial_schema.sql      ✅ 작성완료 (실행은 아직)
```

---

## 환경변수 현황

| 변수 | 로컬(.env.local) | Vercel | 상태 |
|------|:---:|:---:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | 완료 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | 완료 |
| `ADMIN_PIN` | ✅ | ✅ | 완료 |
| `GEMINI_API_KEY` | ❌ | ❌ | **미설정** |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ❌ | ❌ | **미설정** |
| `TOSS_SECRET_KEY` | ❌ | ❌ | **미설정** |
| `ALIGO_API_KEY` | ❌ | ❌ | 나중에 |
| `ALIGO_USER_ID` | ❌ | ❌ | 나중에 |
| `ALIGO_SENDER` | ❌ | ❌ | 나중에 |
