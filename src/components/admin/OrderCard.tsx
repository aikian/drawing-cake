'use client'

import Image from 'next/image'
import type { Order } from '@/app/admin/AdminDashboard'

interface Props {
  order: Order
  statusLabel: string
  statusColor: string
  onStatusChange: (id: string, status: string) => Promise<void>
  onPrint: () => void
}

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  pending: { label: '제조 시작', value: 'preparing' },
  preparing: { label: '제조 완료', value: 'ready' },
  ready: { label: '배달 출발', value: 'delivering' },
  delivering: { label: '배달 완료', value: 'done' },
}

export default function OrderCard({ order, statusLabel, statusColor, onStatusChange, onPrint }: Props) {
  const next = NEXT_STATUS[order.status]
  const time = new Date(order.created_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const pickupStr = order.pickup_time
    ? new Date(order.pickup_time).toLocaleString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : null

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* 썸네일 */}
        <div className="flex-shrink-0">
          {order.designs?.thumbnail_url ? (
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E8D9C0]">
              <Image
                src={order.designs.thumbnail_url}
                alt="디자인"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#F5EDD8] flex items-center justify-center text-2xl">
              {order.product_type === 'cake' ? '🎂' : '🍩'}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#2C2417] text-sm">
                {order.users?.name ?? '익명'}{' '}
                <span className="font-normal text-[#A88B63]">
                  {order.users?.phone ? order.users.phone.slice(-4) : ''}
                </span>
              </p>
              <p className="text-xs text-[#A88B63]">
                {order.product_type === 'cake' ? '🎂 케이크' : '🍩 도넛'} {order.quantity}개
                {' · '}
                {order.total_price.toLocaleString()}원
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs text-[#8B6F47]">
              {order.delivery_type === 'pickup' ? (
                <>📍 픽업 {pickupStr ? `· ${pickupStr}` : ''}</>
              ) : (
                <>🚚 배달 · {order.delivery_address ?? ''}</>
              )}
            </p>
            {order.request && (
              <p className="text-xs text-[#A88B63] bg-[#FBF7EF] rounded-lg px-2 py-1">
                💬 {order.request}
              </p>
            )}
            <p className="text-xs text-[#C9B99A]">접수 {time}</p>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex border-t border-[#E0D0B8]">
        <button
          onClick={onPrint}
          className="flex-1 py-2.5 text-sm font-medium text-[#8B6F47] hover:bg-[#FBF7EF] transition-colors flex items-center justify-center gap-1.5 border-r border-[#E0D0B8]"
        >
          <span>🖨</span> QR 프린트
        </button>
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next.value)}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-[#8B6F47] hover:bg-[#5C4A30] transition-colors flex items-center justify-center gap-1"
          >
            {next.label} →
          </button>
        )}
        {!next && (
          <div className="flex-1 py-2.5 text-sm text-[#C9B99A] flex items-center justify-center">
            처리 완료
          </div>
        )}
      </div>
    </div>
  )
}
