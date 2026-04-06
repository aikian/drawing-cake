'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DesignCanvas = dynamic(
  () => import('@/components/canvas/DesignCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
          <span className="text-sm text-[#A88B63]">캔버스 로딩 중...</span>
        </div>
      </div>
    ),
  }
)

interface Props {
  productType: 'cake' | 'donut'
}

export default function DesignPageClient({ productType }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (dataUrl: string, canvasJson: object) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?next=/design?type=${productType}`)
        return
      }

      // base64 → Blob
      const blob = await fetch(dataUrl).then(r => r.blob())
      const fileName = `designs/${user.id}/${Date.now()}.png`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('designs')
        .upload(fileName, blob, { contentType: 'image/png', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(uploadData.path)

      // designs 테이블에 저장
      const { data: design, error: dbError } = await supabase
        .from('designs')
        .insert({
          user_id: user.id,
          canvas_data: canvasJson,
          thumbnail_url: publicUrl,
          product_type: productType,
          title: `${productType === 'cake' ? '케이크' : '도넛'} 디자인`,
        })
        .select('id')
        .single()

      if (dbError) throw dbError

      router.push(`/checkout?design_id=${design.id}&type=${productType}`)
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E0D0B8]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎂</span>
            <span className="font-bold text-[#5C4A30] text-lg">드로잉케이크</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm px-3 py-1 bg-[#F5EDD8] rounded-full text-[#8B6F47] font-medium">
              {productType === 'cake' ? '🎂 커스텀 케이크' : '🍩 커스텀 도넛'}
            </span>
            <a href="/order" className="text-xs text-[#C9B99A] hover:text-[#8B6F47] transition-colors">
              상품 변경
            </a>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2C2417]">나만의 디자인 만들기</h1>
          <p className="text-[#A88B63] mt-2 text-sm">
            AI로 생성하거나, 직접 그리거나, 이미지를 업로드해보세요
          </p>
        </div>

        {saving ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
            <p className="text-[#8B6F47] font-medium">디자인 저장 중...</p>
          </div>
        ) : (
          <DesignCanvas productType={productType} onSave={handleSave} />
        )}
      </main>
    </div>
  )
}
