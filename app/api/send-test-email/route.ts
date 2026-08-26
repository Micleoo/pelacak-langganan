import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let targetEmail = body.email;

    // Ambil data settings dari Supabase bila targetEmail belum disediakan
    const { data: settings } = await supabase
      .from("app_settings")
      .select("email_enabled, user_email, default_notify_days_before")
      .single();

    if (!targetEmail) {
      targetEmail = settings?.user_email;
    }

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { error: "Alamat email tidak valid atau belum diisi." },
        { status: 400 }
      );
    }

    // 1. Panggil Supabase Edge Function send-reminders (di mana RESEND_API_KEY sudah terpasang di Supabase Secrets)
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke(
        "send-reminders",
        {
          body: { is_test: true, email: targetEmail },
        }
      );

      if (!funcError && funcData) {
        if (funcData.delivered || funcData.success) {
          return NextResponse.json({
            success: true,
            delivered: true,
            message: funcData.message || `Email uji coba berhasil dikirim ke ${targetEmail}!`,
            id: funcData.resend_response?.id,
          });
        }
        if (funcData.error) {
          let errorMsg = funcData.error;
          if (typeof errorMsg === "string" && errorMsg.includes("API key is invalid")) {
            errorMsg = "RESEND_API_KEY tidak valid atau belum diisi dengan key Resend aktif. Perbarui RESEND_API_KEY di Supabase Secrets atau .env.local.";
          }
          return NextResponse.json(
            { error: errorMsg },
            { status: 502 }
          );
        }
      }

      if (funcError) {
        console.warn("Supabase functions.invoke warning:", funcError);
      }
    } catch (e) {
      console.warn("Error invoking Supabase Edge Function:", e);
    }

    // 2. Fallback jika RESEND_API_KEY tersedia di environment Next.js (.env.local)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Ambil data expenses aktif
      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, name, amount, interval, next_billing_date, status")
        .eq("status", "active")
        .order("next_billing_date", { ascending: true })
        .limit(5);

      const expenseList = expenses && expenses.length > 0 ? expenses : [
        { name: "Netflix Premium", amount: 186000, next_billing_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10) },
        { name: "Spotify Individual", amount: 54990, next_billing_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10) }
      ];

      const expenseListHtml = expenseList
        .map(
          (e) =>
            `<li style="margin-bottom: 8px;"><strong>${e.name}</strong> - Rp ${e.amount.toLocaleString("id-ID")} (Jatuh tempo: ${e.next_billing_date})</li>`
        )
        .join("");

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.5;">
          <div style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
            <h2 style="color: #0d9488; margin: 0; font-size: 20px;">Pelacak Langganan</h2>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Pengingat Tagihan & Langganan Rutin (Email Uji Coba)</p>
          </div>
          <p>Halo,</p>
          <p>Ini adalah email pengingat uji coba dari aplikasi <strong>Pelacak Langganan</strong>. Sistem notifikasi email Anda telah berhasil terkonfigurasi dengan baik!</p>
          <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 15px; color: #334155;">Contoh Tagihan yang Akan Datang:</h3>
            <ul style="padding-left: 20px; margin-bottom: 0;">
              ${expenseListHtml}
            </ul>
          </div>
          <p style="font-size: 14px; color: #64748b;">Pengingat otomatis akan dikirimkan sesuai dengan timing H- yang telah Anda tentukan di menu Pengaturan.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Dikirim secara otomatis oleh Pelacak Langganan</p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Pelacak Langganan <onboarding@resend.dev>",
          to: [targetEmail],
          subject: "✓ [Uji Coba] Pengingat Tagihan — Pelacak Langganan",
          html: htmlContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: `Gagal mengirim via Resend API: ${data.message || JSON.stringify(data)}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        delivered: true,
        message: `Email uji coba berhasil dikirim ke ${targetEmail}!`,
        id: data.id,
      });
    }

    // 3. Jika Edge function gagal & belum ada RESEND_API_KEY lokal
    return NextResponse.json(
      {
        error: "Gagal menghubungkan ke layanan pengiriman email. Pastikan Edge Function send-reminders sudah dideploy atau konfigurasi RESEND_API_KEY.",
      },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat memproses email." },
      { status: 500 }
    );
  }
}
