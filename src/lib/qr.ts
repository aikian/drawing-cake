import QRCode from 'qrcode'

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#2C2417',
      light: '#FDFAF6',
    },
    errorCorrectionLevel: 'H',
  })
}
