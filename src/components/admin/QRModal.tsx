'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Props {
  imageUrl: string
  orderNum: string
  onClose: () => void
}

export default function QRModal({ imageUrl, orderNum, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(imageUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#2C2417', light: '#FDFAF6' },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl)
    })
  }, [imageUrl])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🖨</div>
          <h2 className="text-xl font-bold text-[#2C2417]">QR 코드 프린트</h2>
          <p className="text-sm text-[#A88B63] mt-1">주문번호 #{orderNum}</p>
        </div>

        {/* QR 코드 */}
        {qrDataUrl ? (
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#FDFAF6] rounded-2xl border-2 border-[#E0D0B8]">
              <Image src={qrDataUrl} alt="QR 코드" width={240} height={240} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-60">
            <div className="w-8 h-8 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
          </div>
        )}

        {/* 디자인 미리보기 */}
        <div className="flex items-center gap-3 p-3 bg-[#FBF7EF] rounded-xl mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image src={imageUrl} alt="디자인" width={48} height={48} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#5C4A30]">인쇄될 이미지</p>
            <p className="text-xs text-[#A88B63] truncate max-w-[180px]">{imageUrl.split('/').pop()}</p>
          </div>
        </div>

        <p className="text-xs text-[#C9B99A] text-center mb-4">
          EVEBOT EB-FC1으로 QR 코드를 스캔하면<br />이미지가 자동으로 인쇄됩니다.
        </p>

        <button onClick={onClose} className="btn-secondary w-full">
          닫기
        </button>
      </div>
    </div>
  )
}
