import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCakeImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json()
  const { prompt, product_type } = body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 })
  }
  if (product_type !== 'cake' && product_type !== 'donut') {
    return NextResponse.json({ error: '상품 타입이 올바르지 않습니다.' }, { status: 400 })
  }

  // 크레딧 확인
  const { data: credits, error: creditError } = await supabase
    .from('ai_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (creditError || !credits || credits.balance < 1) {
    return NextResponse.json(
      { error: '크레딧이 부족합니다. 주문 완료 후 크레딧을 획득하세요.' },
      { status: 403 }
    )
  }

  try {
    // Gemini로 이미지 생성
    const imageDataUrl = await generateCakeImage(prompt.trim(), product_type)

    // base64 → Supabase Storage 업로드
    const base64Data = imageDataUrl.split(',')[1]
    const mimeType = imageDataUrl.split(';')[0].split(':')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `ai-generated/${user.id}/${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('designs')
      .upload(fileName, buffer, { contentType: mimeType, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(uploadData.path)

    // 크레딧 차감 (원자적 처리)
    const { error: deductError } = await supabase.rpc('deduct_ai_credit', { p_user_id: user.id })
    if (deductError) throw deductError

    // credit_history 기록
    await supabase.from('credit_history').insert({
      user_id: user.id,
      amount: -1,
      reason: 'ai_use',
      expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({ image_url: publicUrl })
  } catch (e) {
    console.error('[AI Generate Error]', e)
    return NextResponse.json(
      { error: 'AI 이미지 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
