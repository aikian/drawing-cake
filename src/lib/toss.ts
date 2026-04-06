export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!

export const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm'

export async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
  const response = await fetch(TOSS_CONFIRM_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? '결제 승인에 실패했습니다.')
  }

  return response.json()
}
