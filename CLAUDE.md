# 드로잉케이크 (drawingcake) — Claude Code 컨텍스트

## 프로젝트 개요

**서비스명:** 드로잉케이크 (drawingcake.co.kr)  
**법인명:** ArTec Studio (알텍 스튜디오)  
**형태:** AI × 미술 융합 즉석 커스텀 케이크·도넛 주문 플랫폼  
**한 줄 설명:** 고객이 웹에서 AI로 이미지를 생성하거나 직접 그리면, 식용 프린터가 케이크·도넛에 즉시 인쇄해주는 서비스

**GitHub:** https://github.com/aikian/drawing-cake  
**Vercel:** https://drawing-cake.vercel.app  
**Supabase Project ID:** xkfvbnwckwdntduecils  
**Supabase Region:** ap-northeast-2 (서울)

---

## 기술 스택

```
Frontend:  Next.js 14 (App Router), TypeScript, Tailwind CSS
Canvas:    Fabric.js (원형 캔버스 기반 디자인 툴)
Backend:   Supabase (PostgreSQL + Auth + Storage + Realtime)
AI:        Google Gemini API (gemini-2.5-flash-image) — 이미지 생성
결제:      Toss Payments
배포:      Vercel
SMS:       Aligo API
QR:        qrcode 라이브러리
```

---

## 폴더 구조

```
src/
├── app/
│   ├── (public)/           # 고객용 페이지
│   │   ├── page.tsx        # 랜딩
│   │   ├── order/          # 상품 선택
│   │   ├── design/         # 디자인 캔버스 (핵심)
│   │   ├── checkout/       # 주문 확인 + 결제
│   │   ├── complete/       # 주문 완료
│   │   └── mypage/         # 마이페이지
│   ├── admin/              # 관리자 페이지 (PIN 인증)
│   │   ├── page.tsx        # 주문 대시보드
│   │   └── stats/          # 매출 통계
│   └── api/
│       ├── ai/generate/    # Gemini AI 이미지 생성
│       ├── payments/       # Toss Payments 연동
│       └── orders/         # 주문 처리
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # 브라우저용 클라이언트
│   │   └── server.ts       # 서버용 클라이언트
│   ├── toss.ts             # Toss Payments 설정
│   ├── gemini.ts           # Google Gemini API
│   └── qr.ts              # QR 코드 생성
└── components/
    ├── canvas/             # Fabric.js 캔버스 컴포넌트
    ├── admin/              # 관리자 UI
    └── ui/                 # 공통 UI
```

---

## Supabase 데이터베이스 스키마

### users
```sql
id            uuid  PK
email         text  NOT NULL UNIQUE
name          text
phone         text
provider      text  -- 'kakao' | 'google'
default_address text
created_at    timestamptz
```

### designs
```sql
id            uuid  PK
user_id       uuid  FK → users.id
title         text
canvas_data   jsonb  -- Fabric.js 캔버스 전체 상태
thumbnail_url text   -- Supabase Storage URL
product_type  text   -- 'cake' | 'donut'
created_at    timestamptz
```

### orders
```sql
id              uuid  PK
user_id         uuid  FK → users.id
design_id       uuid  FK → designs.id
product_type    text  NOT NULL  -- 'cake' | 'donut'
quantity        int   DEFAULT 1
total_price     int   NOT NULL  -- 원 단위
delivery_type   text  -- 'pickup' | 'delivery'
delivery_address text
pickup_time     timestamptz
status          text  DEFAULT 'pending'
                -- pending | preparing | ready | delivering | done
request         text
toss_payment_key text
created_at      timestamptz
```

### ai_credits
```sql
id          uuid  PK
user_id     uuid  FK → users.id  UNIQUE
balance     int   DEFAULT 0
updated_at  timestamptz
```

### credit_history
```sql
id          uuid  PK
user_id     uuid  FK → users.id
order_id    uuid  FK → orders.id
amount      int   NOT NULL  -- +3, -1 등
reason      text  -- 'order_reward' | 'ai_use' | 'bonus_reward'
expires_at  timestamptz
created_at  timestamptz
```

---

## 핵심 비즈니스 로직

### 상품 및 가격
```
커스텀 케이크 (9cm): 22,000원  원가 7,000원
커스텀 도넛:         6,000원  원가 2,000원
도넛 4개 세트:      20,000원
음료 (아아·라떼):    4,500원
```

### AI 크레딧 시스템
- 주문 완료 시: +3 크레딧 지급
- 30,000원 이상 주문 시: 다음 주문에 추가 +3 크레딧
- AI 이미지 생성 1회당: -1 크레딧
- 크레딧 만료: 적립일로부터 6개월
- 디자인 보관함: 유저당 최대 10개

### 주문 상태 흐름
```
pending → preparing → ready → (delivering) → done
```

---

## 페이지별 상세 스펙

### `/` 랜딩
- 브랜드 소개, 대표 이미지
- "지금 주문하기" CTA
- 영업시간: 11:00~20:00
- 매장 위치: 대구 남구 대명동 명덕역~교대역 라인

### `/order` 상품 선택
- 케이크 / 도넛 선택 카드
- 수량 선택 (1~10개)
- 로그인 체크 → 미로그인 시 소셜 로그인 유도

### `/design` 디자인 캔버스 ⭐ 핵심
- **캔버스**: Fabric.js 원형 캔버스
  - 케이크: 지름 9cm 비율
  - 도넛: 도넛 형태 마스킹
- **입력 방법 탭**:
  1. AI 생성: 프롬프트 입력 → Gemini API → 캔버스 삽입
  2. 직접 그리기: 브러시, 색상, 굵기 조절
  3. 이미지 업로드: 로컬 파일 → 캔버스 삽입
- **텍스트 추가**: 폰트 선택, 곡률, 테두리, 색상, 크기
- **AI 크레딧**: 상단에 잔여 크레딧 표시 (없으면 비활성화)
- **저장**: 캔버스 → PNG 변환 → Supabase Storage 업로드

### `/checkout` 결제
- 디자인 썸네일 미리보기
- 픽업 / 배달 선택
  - 픽업: 날짜·시간 선택
  - 배달: 주소 입력
- 요청사항 텍스트
- 최종 금액 확인
- Toss Payments 결제창 호출

### `/complete` 주문 완료
- 주문 번호, 예상 준비 시간
- AI 크레딧 적립 내역
- 30,000원 이상이면 보너스 크레딧 안내

### `/mypage` 마이페이지
- 주문 내역 탭: 썸네일 + 상태 + 재주문 버튼
- AI 크레딧 탭: 잔액, 적립/사용 내역, 만료일
- 디자인 보관함: 저장된 디자인 목록 (최대 10개)
- 계정 설정: 이름, 전화번호, 기본 주소

---

## 관리자 페이지 (/admin)

### 접근 방법
- 랜딩 페이지 하단 숨겨진 `···` 버튼 클릭
- 4자리 PIN 입력 (환경변수로 관리)
- 세션 기반 인증 (24시간 유지)

### 주문 대시보드
- Supabase Realtime으로 새 주문 실시간 감지
- 새 주문 알림음 재생
- 주문 카드 구성:
  ```
  [디자인 썸네일] [고객명] [상품/수량]
  [픽업/배달 시간] [요청사항]
  [상태 변경 버튼] [프린트 버튼]
  ```

### 🖨 프린트 버튼 동작 (핵심)
```
프린트 버튼 클릭
    ↓
designs.thumbnail_url 에서 이미지 Public URL 가져오기
    ↓
qrcode 라이브러리로 QR 코드 생성 (URL 담기)
    ↓
모달로 QR 코드 크게 표시
    ↓
EVEBOT EB-FC1 프린터로 QR 스캔
    ↓
프린터가 URL에서 이미지 자동 다운로드 → 인쇄
```

> **EVEBOT QR 동작 방식**: EVEBOT EB-FC1은 QR 코드를 스캔하면 해당 URL의 이미지를 자동으로 불러와서 인쇄함. 따라서 Supabase Storage의 Public URL을 QR에 담으면 됨.

### 매출 통계 (/admin/stats)
- 일별/월별 매출 차트
- 제품별 판매량
- AI 크레딧 사용 현황

---

## API Routes

### POST `/api/ai/generate`
```typescript
// Request
{ prompt: string, product_type: 'cake' | 'donut' }

// 동작
// 1. 유저 AI 크레딧 확인 (없으면 403)
// 2. Gemini API 호출 (gemini-2.5-flash-image)
// 3. 생성된 이미지 → Supabase Storage 업로드
// 4. ai_credits balance -1
// 5. credit_history INSERT

// Response
{ image_url: string }
```

### POST `/api/payments/confirm`
```typescript
// Toss Payments 결제 승인 후 처리
// 1. Toss API로 결제 검증
// 2. orders INSERT (status: 'pending')
// 3. ai_credits balance +3
// 4. credit_history INSERT (reason: 'order_reward')
// 5. 30,000원 이상이면 bonus_reward 예약
// 6. Aligo SMS 발송 (주문 확인)
```

### PATCH `/api/orders/[id]/status`
```typescript
// 관리자용 주문 상태 변경
// Request: { status: 'preparing' | 'ready' | 'delivering' | 'done' }
```

---

## 환경변수 (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xkfvbnwckwdntduecils.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Google Gemini
GEMINI_API_KEY=...

# Toss Payments
TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...

# Aligo SMS
ALIGO_API_KEY=...
ALIGO_USER_ID=...
ALIGO_SENDER=...

# Admin
ADMIN_PIN=...  # 4자리 관리자 PIN
```

---

## 설치 패키지

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install fabric
npm install qrcode @types/qrcode
npm install @tosspayments/payment-sdk
npm install @google/generative-ai
```

---

## 개발 우선순위

1. **Supabase Auth** — 카카오/구글 소셜 로그인
2. **디자인 캔버스** — Fabric.js 원형 캔버스 + 3가지 입력 방법
3. **Gemini AI 이미지 생성** — API Route + 크레딧 차감
4. **Toss Payments 결제** — 결제 + 주문 생성 + 크레딧 지급
5. **관리자 대시보드** — Realtime 주문 목록 + QR 프린트
6. **마이페이지** — 주문 내역 + 크레딧 + 보관함
7. **랜딩 페이지** — UI/UX 완성
8. **SMS 알림** — Aligo 연동

---

## 주요 비즈니스 규칙

- 영업시간: 11:00~20:00 (영업 외 시간 주문 불가 처리)
- 케이크 시트는 매일 오전 9~12시에 사전 제조 (당일 소진 원칙)
- 디자인 보관함 최대 10개 (초과 시 가장 오래된 것 삭제 안내)
- AI 크레딧 만료: 적립일로부터 6개월
- 배달: 배달앱 연동 (배달 기사가 픽업, 매장 인력 영향 없음)
- 관리자 PIN: 환경변수로 관리, 하드코딩 금지
