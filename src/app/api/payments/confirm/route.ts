import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmTossPayment } from '@/lib/toss'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { paymentKey, orderId, amount, orderData } = await request.json()

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: '결제 정보가 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    // Toss 결제 승인
    const payment = await confirmTossPayment(paymentKey, orderId, amount)

    // 주문 생성
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        design_id: orderData.design_id,
        product_type: orderData.product_type,
        quantity: orderData.quantity,
        total_price: amount,
        delivery_type: orderData.delivery_type,
        delivery_address: orderData.delivery_address ?? null,
        pickup_time: orderData.pickup_time ?? null,
        request: orderData.request ?? null,
        status: 'pending',
        toss_payment_key: paymentKey,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // 크레딧 적립 (로그인한 경우)
    if (user) {
      await supabase
        .from('ai_credits')
        .upsert({ user_id: user.id, balance: 3, updated_at: new Date().toISOString() }, {
          onConflict: 'user_id',
        })

      // credit_history 기록
      await supabase.from('credit_history').insert({
        user_id: user.id,
        order_id: order.id,
        amount: 3,
        reason: 'order_reward',
        expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // 30,000원 이상 보너스
      if (amount >= 30000) {
        await supabase.from('credit_history').insert({
          user_id: user.id,
          order_id: order.id,
          amount: 3,
          reason: 'bonus_reward',
          expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    return NextResponse.json({ order_id: order.id, payment })
  } catch (e) {
    console.error('[Payment Confirm Error]', e)
    return NextResponse.json({ error: '결제 처리에 실패했습니다.' }, { status: 500 })
  }
}
