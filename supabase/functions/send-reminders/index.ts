// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Gunakan supabase url & key dari environment variable internal
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseKey!)

Deno.serve(async (req) => {
  // Hanya menerima POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // 1. Dapatkan pengaturan global
  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('email_enabled, user_email, default_notify_days_before')
    .single()

  if (settingsError || !settings?.email_enabled || !settings?.user_email) {
    return new Response(JSON.stringify({ message: 'Email dinonaktifkan atau belum diatur' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Kueri tagihan yang aktif
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('status', 'active')

  if (expensesError) {
    return new Response(JSON.stringify({ error: expensesError }), { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueExpenses = expenses.filter((e) => {
    const notifyDays = e.notify_days_before ?? settings.default_notify_days_before
    const nextBilling = new Date(e.next_billing_date)
    const reminderDate = new Date(nextBilling.getTime())
    reminderDate.setDate(reminderDate.getDate() - notifyDays)
    
    return (
      reminderDate.getFullYear() === today.getFullYear() &&
      reminderDate.getMonth() === today.getMonth() &&
      reminderDate.getDate() === today.getDate()
    )
  })

  if (dueExpenses.length === 0) {
    return new Response(JSON.stringify({ message: 'Tidak ada tagihan yang harus diingatkan hari ini.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
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
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY tidak ditemukan' }), { status: 500 })
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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
