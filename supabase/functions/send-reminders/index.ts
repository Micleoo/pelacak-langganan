// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASS = Deno.env.get('SMTP_PASS')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Gunakan supabase url & key dari environment variable internal
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseKey!)

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Hanya menerima POST
  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const isTest = Boolean(body.is_test || body.test)

    // 1. Dapatkan pengaturan global
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('email_enabled, user_email, default_notify_days_before')
      .single()

    const targetEmail = body.email || settings?.user_email

    if (isTest) {
      if (!targetEmail) {
        return errorResponse('Alamat email belum diatur.', 400)
      }
    } else {
      if (settingsError || !settings?.email_enabled || !settings?.user_email) {
        return successResponse({ message: 'Email dinonaktifkan atau belum diatur' })
      }
    }

    // 2. Kueri tagihan yang aktif
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('status', 'active')
      .order('next_billing_date', { ascending: true })

    if (expensesError && !isTest) {
      return errorResponse(`Gagal mengambil data biaya: ${expensesError.message}`)
    }

    let dueExpenses = []

    if (isTest) {
      // Dalam mode test, gunakan tagihan aktif yang ada atau contoh simulasi
      if (expenses && expenses.length > 0) {
        dueExpenses = expenses.slice(0, 5)
      } else {
        dueExpenses = [
          { name: 'Netflix Premium', amount: 186000, next_billing_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10) },
          { name: 'Spotify Individual', amount: 54990, next_billing_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10) },
        ]
      }
    } else {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      dueExpenses = (expenses || []).filter((e) => {
        const notifyDays = e.notify_days_before ?? settings.default_notify_days_before
        const nextBilling = new Date(e.next_billing_date + 'T00:00:00Z')
        const reminderDate = new Date(nextBilling.getTime())
        reminderDate.setUTCDate(reminderDate.getUTCDate() - notifyDays)
        
        return (
          reminderDate.getUTCFullYear() === today.getUTCFullYear() &&
          reminderDate.getUTCMonth() === today.getUTCMonth() &&
          reminderDate.getUTCDate() === today.getUTCDate()
        )
      })

      if (dueExpenses.length === 0) {
        return successResponse({ message: 'Tidak ada tagihan yang harus diingatkan hari ini.' })
      }
    }

    // 3. Susun HTML untuk email
    const expenseListHtml = dueExpenses.map(e => `
      <li style="margin-bottom: 8px;"><strong>${e.name}</strong> - Rp ${e.amount.toLocaleString('id-ID')} (Jatuh tempo: ${e.next_billing_date})</li>
    `).join('')

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.5;">
        <div style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
          <h2 style="color: #0d9488; margin: 0; font-size: 20px;">Pelacak Langganan</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">${isTest ? 'Pengingat Tagihan & Langganan Rutin (Email Uji Coba)' : 'Pengingat Tagihan & Langganan Rutin'}</p>
        </div>
        <p>Halo,</p>
        <p>${isTest ? 'Ini adalah email pengingat uji coba dari aplikasi <strong>Pelacak Langganan</strong>. Sistem notifikasi email Anda telah berhasil terhubung dan siap mengirimkan pengingat.' : 'Ada beberapa tagihan rutin Anda yang akan segera jatuh tempo:'}</p>
        <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 15px; color: #334155;">${isTest ? 'Contoh Tagihan yang Akan Datang:' : 'Daftar Tagihan Mendekati Jatuh Tempo:'}</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            ${expenseListHtml}
          </ul>
        </div>
        <p style="font-size: 14px; color: #64748b;">Silakan siapkan dana Anda agar layanan tidak terputus. Terima kasih!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Dikirim secara otomatis oleh Pelacak Langganan</p>
      </div>
    `

    // 4. Kirim email via Gmail SMTP (jika SMTP_USER dan SMTP_PASS ada)
    if (SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        })

        const emailSender = Deno.env.get('EMAIL_FROM') || `Pelacak Langganan <${SMTP_USER}>`

        const info = await transporter.sendMail({
          from: emailSender,
          to: targetEmail,
          subject: isTest ? '✓ [Uji Coba] Pengingat Tagihan — Pelacak Langganan' : 'Pengingat Tagihan Anda — Pelacak Langganan',
          html: htmlContent,
        })

        return successResponse({
          success: true,
          delivered: true,
          message: `Berhasil mengirim pengingat ke ${targetEmail} via Gmail (${dueExpenses.length} biaya)`,
          sent_count: dueExpenses.length,
          smtp_response: { messageId: info.messageId },
        })
      } catch (smtpErr) {
        console.error('Gmail SMTP Error:', smtpErr)
        return errorResponse(`Gagal mengirim via Gmail SMTP: ${smtpErr.message}`, 502)
      }
    }

    // 5. Fallback Kirim email via Resend
    if (!RESEND_API_KEY) {
      return errorResponse('Layanan email belum dikonfigurasi. Silakan set SMTP_USER & SMTP_PASS (Gmail) atau RESEND_API_KEY pada Supabase Secrets.')
    }

    const emailSender = Deno.env.get('EMAIL_FROM') || 'Pelacak Langganan <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: emailSender,
        to: [targetEmail],
        subject: isTest ? '✓ [Uji Coba] Pengingat Tagihan — Pelacak Langganan' : 'Pengingat Tagihan Anda — Pelacak Langganan',
        html: htmlContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      if (res.status === 403 && data.message?.includes('testing emails to your own email address')) {
        return errorResponse(
          `Domain pengirim Resend (${emailSender}) saat ini berada dalam mode sandbox testing dan hanya diizinkan mengirim ke email pemilik akun Resend terdaftar. Untuk mengirim ke email lain secara gratis, gunakan Gmail SMTP (SMTP_USER & SMTP_PASS) atau verifikasi custom domain. (Pesan Resend: ${data.message})`,
          403
        )
      }
      return errorResponse(`Gagal mengirim email via Resend: ${data.message || JSON.stringify(data)}`, 502)
    }

    return successResponse({ 
      success: true,
      delivered: true,
      message: `Berhasil mengirim pengingat ke ${targetEmail} (${dueExpenses.length} biaya)`,
      sent_count: dueExpenses.length,
      resend_response: data
    })
  } catch (err) {
    console.error('Edge Function error:', err)
    return errorResponse(`Internal server error: ${err.message}`)
  }
})