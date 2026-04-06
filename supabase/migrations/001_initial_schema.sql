-- ============================================================
-- 드로잉케이크 초기 스키마
-- Supabase Project: xkfvbnwckwdntduecils
-- ============================================================

-- 1. users (Auth의 auth.users를 참조하는 프로필 테이블)
CREATE TABLE IF NOT EXISTS public.users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL UNIQUE,
  name            text,
  phone           text,
  provider        text,  -- 'kakao' | 'google'
  default_address text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: 본인만 조회/수정" ON public.users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- 2. designs
CREATE TABLE IF NOT EXISTS public.designs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         text,
  canvas_data   jsonb,
  thumbnail_url text,
  product_type  text NOT NULL CHECK (product_type IN ('cake', 'donut')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "designs: 본인만 CRUD" ON public.designs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  design_id        uuid REFERENCES public.designs(id) ON DELETE SET NULL,
  product_type     text NOT NULL CHECK (product_type IN ('cake', 'donut')),
  quantity         int  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price      int  NOT NULL CHECK (total_price >= 0),
  delivery_type    text NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_address text,
  pickup_time      timestamptz,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'preparing', 'ready', 'delivering', 'done')),
  request          text,
  toss_payment_key text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: 본인 주문 조회" ON public.orders
  USING (auth.uid() = user_id);
CREATE POLICY "orders: service_role 전체 접근" ON public.orders
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- 4. ai_credits
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance    int  NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_credits: 본인만 조회" ON public.ai_credits
  USING (auth.uid() = user_id);


-- 5. credit_history
CREATE TABLE IF NOT EXISTS public.credit_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount     int  NOT NULL,
  reason     text NOT NULL CHECK (reason IN ('order_reward', 'ai_use', 'bonus_reward')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_history: 본인만 조회" ON public.credit_history
  USING (auth.uid() = user_id);


-- ============================================================
-- 함수: AI 크레딧 원자적 차감
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_ai_credit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_credits
  SET balance = balance - 1,
      updated_at = now()
  WHERE user_id = p_user_id AND balance > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$;


-- ============================================================
-- 함수: 신규 유저 가입 시 자동으로 users + ai_credits 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ai_credits (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- Storage 버킷
-- ============================================================
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('designs', 'designs', true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "designs storage: 인증된 사용자 업로드"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "designs storage: 공개 읽기"
ON storage.objects FOR SELECT
USING (bucket_id = 'designs');


-- ============================================================
-- Realtime 활성화
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
