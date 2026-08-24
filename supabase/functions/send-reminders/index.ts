// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // 1. Dapatkan pengaturan global
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('email_enabled, user_email, default_notify_days_before')
      .single()

    if (settingsError || !settings?.email_enabled || !settings?.user_email) {
      return successResponse({ message: 'Email dinonaktifkan atau belum diatur' })
    }

    // 2. Kueri tagihan yang aktif
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('status', 'active')

    if (expensesError) {
      return errorResponse(`Gagal mengambil data biaya: ${expensesError.message}`)
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const dueExpenses = expenses.filter((e) => {
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

    // 3. Susun HTML untuk email
    const expenseListHtml = dueExpenses.map(e => `
      <li><strong>${e.name}</strong> - Rp ${e.amount.toLocaleString('id-ID')} (Jatuh tempo: ${e.next_billing_date})</li>
    `).join('')

    const htmlContent = `
      <h2>Pengingat Tagihan Anda</h2>
      <p>Halo, ada beberapa tagihan rutin Anda yang akan segera jatuh tempo:</p>
      <ul>
        ${expenseListHtml}
      </ul>
      <p>Silakan siapkan dana Anda agar layanan tidak terputus. Terima kasih!</p>
    `

    // 4. Kirim email via Resend
    if (!RESEND_API_KEY) {
      return errorResponse('RESEND_API_KEY tidak ditemukan')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Pelacak Langganan <onboarding@resend.dev>',
        to: [settings.user_email],
        subject: 'Pengingat Tagihan Anda',
        html: htmlContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      return errorResponse(`Gagal mengirim email: ${JSON.stringify(data)}`)
    }

    return successResponse({ 
      message: `Berhasil mengirim pengingat untuk ${dueExpenses.length} biaya`,
      sent_count: dueExpenses.length,
      resend_response: data
    })
  } catch (err) {
    console.error('Edge Function error:', err)
    return errorResponse(`Internal server error: ${err.message}`)
  }
})