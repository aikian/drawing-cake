import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateCakeImage(prompt: string, productType: 'cake' | 'donut'): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp-image-generation' })

  const systemContext = productType === 'cake'
    ? '원형 케이크 위에 식용 잉크로 프린트할 이미지. 원형 구도, 깔끔하고 선명한 그래픽, 흰색 배경.'
    : '도넛 위에 식용 잉크로 프린트할 이미지. 원형 구도, 도넛 형태 마스킹 고려, 깔끔한 그래픽.'

  const fullPrompt = `${systemContext} 주제: ${prompt}. 스타일: 밝고 선명한 디지털 일러스트레이션.`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseModalities: ['image', 'text'],
    } as never,
  })

  const response = result.response
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if ((part as { inlineData?: { mimeType: string; data: string } }).inlineData) {
      const inlineData = (part as { inlineData: { mimeType: string; data: string } }).inlineData
      return `data:${inlineData.mimeType};base64,${inlineData.data}`
    }
  }

  throw new Error('이미지 생성에 실패했습니다.')
}
