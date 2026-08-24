// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405)
  }

  try {
    const { data, error } = await supabase.rpc('reconcile_orphaned_expenses')

    if (error) {
      return errorResponse(`Gagal menjalankan rekonsiliasi: ${error.message}`)
    }

    return successResponse({ 
      message: 'Rekonsiliasi selesai',
      reconciled_count: data 
    })
  } catch (err) {
    console.error('Reconcile Edge Function error:', err)
    return errorResponse(`Internal server error: ${err.message}`)
  }
})