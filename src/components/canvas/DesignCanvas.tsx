'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Canvas, Circle, FabricImage, IText } from 'fabric'

interface DesignCanvasProps {
  productType: 'cake' | 'donut'
  onSave: (dataUrl: string, canvasJson: object) => void
}

type InputTab = 'ai' | 'draw' | 'upload'

const CANVAS_SIZE = 400
const FONTS = ['Noto Sans KR', 'serif', 'monospace', 'cursive', 'fantasy']
const FONT_LABELS = ['산돌체', '명조', '모노', '필기체', '판타지']
const BRUSH_SIZES = [2, 5, 10, 20, 40]

export default function DesignCanvas({ productType, onSave }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const [activeTab, setActiveTab] = useState<InputTab>('ai')
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#8B6F47')
  const [brushSize, setBrushSize] = useState(5)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCredits, setAiCredits] = useState(3)
  const [textInput, setTextInput] = useState('')
  const [textFont, setTextFont] = useState('Noto Sans KR')
  const [textColor, setTextColor] = useState('#2C2417')
  const [textSize, setTextSize] = useState(24)
  const [textCurve, setTextCurve] = useState(0)

  // Fabric.js 초기화
  useEffect(() => {
    if (!canvasRef.current) return

    let mounted = true

    import('fabric').then(({ Canvas, Circle, FabricText }) => {
      if (!mounted || !canvasRef.current) return

      const canvas = new Canvas(canvasRef.current, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: '#FFFFFF',
        selection: true,
      })

      fabricRef.current = canvas

      // 원형 클리핑
      const clipCircle = new Circle({
        radius: CANVAS_SIZE / 2,
        originX: 'center',
        originY: 'center',
        left: CANVAS_SIZE / 2,
        top: CANVAS_SIZE / 2,
      })

      canvas.clipPath = clipCircle

      // 도넛이면 배경에 도넛 가이드라인 표시
      if (productType === 'donut') {
        const outerGuide = new Circle({
          radius: CANVAS_SIZE / 2 - 5,
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
          stroke: '#E0D0B8',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        })
        const innerGuide = new Circle({
          radius: CANVAS_SIZE * 0.18,
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          originX: 'center',
          originY: 'center',
          fill: '#f5f5f5',
          stroke: '#E0D0B8',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        })
        canvas.add(outerGuide)
        canvas.add(innerGuide)
      }

      canvas.renderAll()

      return () => {
        mounted = false
        canvas.dispose()
      }
    })

    return () => {
      mounted = false
    }
  }, [productType])

  // 드로잉 모드 토글
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    import('fabric').then(({ PencilBrush }) => {
      if (activeTab === 'draw' && isDrawing) {
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush = new PencilBrush(canvas)
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize
      } else {
        canvas.isDrawingMode = false
      }
    })
  }, [activeTab, isDrawing, brushColor, brushSize])

  // 브러시 설정 업데이트
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvas.freeDrawingBrush) return
    canvas.freeDrawingBrush.color = brushColor
    canvas.freeDrawingBrush.width = brushSize
  }, [brushColor, brushSize])

  // AI 이미지 생성
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || aiCredits <= 0 || aiLoading) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, product_type: productType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI 생성 실패')
      await addImageToCanvas(data.image_url)
      setAiCredits(c => c - 1)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  // 캔버스에 이미지 추가
  const addImageToCanvas = useCallback(async (src: string) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const { FabricImage } = await import('fabric')
    const img = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' })

    const scale = Math.min(
      (CANVAS_SIZE * 0.85) / (img.width ?? 1),
      (CANVAS_SIZE * 0.85) / (img.height ?? 1)
    )
    img.set({
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }, [])

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      addImageToCanvas(src)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 텍스트 추가
  const handleAddText = async () => {
    if (!textInput.trim()) return
    const canvas = fabricRef.current
    if (!canvas) return

    const { IText } = await import('fabric')
    const text = new IText(textInput, {
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: textFont,
      fontSize: textSize,
      fill: textColor,
      stroke: textColor === '#FFFFFF' ? '#000000' : undefined,
      strokeWidth: 0,
      editable: true,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    setTextInput('')
  }

  // 선택 삭제
  const handleDelete = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      canvas.remove(active)
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }

  // 저장
  const handleSave = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 })
    const json = canvas.toJSON()
    onSave(dataUrl, json)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl mx-auto">
      {/* 캔버스 영역 */}
      <div className="flex flex-col items-center gap-4 flex-shrink-0">
        <div className="relative">
          <div
            className="rounded-full overflow-hidden shadow-lg border-4 border-[#E8D9C0]"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            <canvas ref={canvasRef} />
          </div>
          {/* 크레딧 배지 */}
          <div className="absolute -top-3 -right-3 bg-[#8B6F47] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            AI 크레딧 {aiCredits}개
          </div>
        </div>

        {/* 캔버스 액션 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="btn-secondary text-sm px-4 py-2"
          >
            선택 삭제
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-sm px-6 py-2"
          >
            이 디자인으로 주문하기
          </button>
        </div>
      </div>

      {/* 도구 패널 */}
      <div className="flex-1 min-w-0">
        {/* 탭 */}
        <div className="flex gap-1 bg-[#F5EDD8] rounded-xl p-1 mb-4">
          {([['ai', 'AI 생성'], ['draw', '직접 그리기'], ['upload', '이미지 업로드']] as const).map(
            ([tab, label]) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  if (tab !== 'draw') setIsDrawing(false)
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab ? 'tab-active shadow-sm' : 'tab-inactive'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* AI 생성 탭 */}
        {activeTab === 'ai' && (
          <div className="card p-5 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5C4A30] mb-2">
                어떤 이미지를 원하세요?
              </label>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="예: 귀여운 강아지, 벚꽃, 생일 케이크..."
                rows={3}
                className="input resize-none"
              />
            </div>
            <button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || aiCredits <= 0 || aiLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  이미지 생성 중...
                </>
              ) : aiCredits <= 0 ? (
                '크레딧 부족 (주문 시 +3 적립)'
              ) : (
                <>
                  <span>✨</span>
                  AI 이미지 생성 (크레딧 1 사용)
                </>
              )}
            </button>
            <p className="text-xs text-[#C9B99A]">
              주문 완료 시 +3 크레딧 자동 적립 · 30,000원 이상 주문 시 +3 보너스
            </p>
          </div>
        )}

        {/* 직접 그리기 탭 */}
        {activeTab === 'draw' && (
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#5C4A30]">그리기 모드</span>
              <button
                onClick={() => setIsDrawing(d => !d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isDrawing
                    ? 'bg-[#8B6F47] text-white'
                    : 'border border-[#8B6F47] text-[#8B6F47] hover:bg-[#F5EDD8]'
                }`}
              >
                {isDrawing ? '그리기 ON' : '그리기 OFF'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A30] mb-2">색상</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brushColor}
                  onChange={e => setBrushColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[#E0D0B8] cursor-pointer"
                />
                <div className="flex gap-2 flex-wrap">
                  {['#2C2417', '#8B6F47', '#E8D9C0', '#F2C4BE', '#A8C5A0', '#7BB3D8', '#FFFFFF'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        brushColor === color ? 'border-[#8B6F47] scale-110' : 'border-[#E0D0B8]'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C4A30] mb-2">
                브러시 크기: {brushSize}px
              </label>
              <div className="flex gap-2">
                {BRUSH_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all ${
                      brushSize === s ? 'border-[#8B6F47] bg-[#F5EDD8]' : 'border-[#E0D0B8] bg-white'
                    }`}
                  >
                    <div
                      className="rounded-full bg-[#5C4A30]"
                      style={{ width: Math.min(s * 1.5, 32), height: Math.min(s * 1.5, 32) }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 이미지 업로드 탭 */}
        {activeTab === 'upload' && (
          <div className="card p-5">
            <label className="block text-sm font-medium text-[#5C4A30] mb-3">
              이미지 파일 선택
            </label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#E0D0B8] rounded-xl cursor-pointer hover:bg-[#FBF7EF] transition-colors">
              <div className="text-3xl mb-2">📁</div>
              <span className="text-sm text-[#A88B63]">클릭하거나 파일을 드래그하세요</span>
              <span className="text-xs text-[#C9B99A] mt-1">PNG, JPG, GIF, WebP 지원</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}

        {/* 텍스트 추가 — 공통 */}
        <div className="card p-5 mt-4">
          <h3 className="text-sm font-semibold text-[#5C4A30] mb-3">텍스트 추가</h3>
          <div className="flex flex-col gap-3">
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="캔버스에 넣을 텍스트"
              className="input"
              onKeyDown={e => e.key === 'Enter' && handleAddText()}
            />
            <div className="flex gap-2 flex-wrap">
              {FONTS.map((f, i) => (
                <button
                  key={f}
                  onClick={() => setTextFont(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    textFont === f
                      ? 'bg-[#8B6F47] text-white border-[#8B6F47]'
                      : 'border-[#E0D0B8] text-[#8B6F47] hover:bg-[#F5EDD8]'
                  }`}
                  style={{ fontFamily: f }}
                >
                  {FONT_LABELS[i]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={textColor}
                onChange={e => setTextColor(e.target.value)}
                className="w-8 h-8 rounded border border-[#E0D0B8] cursor-pointer"
              />
              <input
                type="range"
                min={12}
                max={72}
                value={textSize}
                onChange={e => setTextSize(+e.target.value)}
                className="flex-1 accent-[#8B6F47]"
              />
              <span className="text-xs text-[#A88B63] w-12">{textSize}px</span>
            </div>
            <button
              onClick={handleAddText}
              disabled={!textInput.trim()}
              className="btn-secondary w-full"
            >
              텍스트 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
