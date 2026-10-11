import 'server-only'

// Resend üzerinden e-posta gönderimi. RESEND_API_KEY tanımlı değilse
// sessizce atlanır (uygulama içi bildirimler her durumda çalışır).

export interface EmailMessage {
  to: string
  subject: string
  text: string
}

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!emailEnabled()) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
