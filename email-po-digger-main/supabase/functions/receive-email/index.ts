/// <reference path="./deno.d.ts" />
/// <reference path="./deno-imports.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface WebhookEmail {
  from: string
  to: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
    content?: string
  }>
  date?: string
  messageId?: string
}

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify webhook secret from headers (optional but recommended)
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  const providedSecret = req.headers.get('x-webhook-secret')
  
  if (webhookSecret && providedSecret !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const emailData = (await req.json()) as WebhookEmail

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Normalize recipient
    const toRecipients = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to

    // Insert email
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .insert({
        sender: emailData.from,
        to_recipients: toRecipients,
        subject: emailData.subject,
        body: emailData.text || '',
        body_html: emailData.html,
        received_at: emailData.date ? new Date(emailData.date).toISOString() : new Date().toISOString(),
        raw_email: emailData,
        webhook_id: emailData.messageId,
      })
      .select()
      .single()

    if (emailError) {
      console.error('Error inserting email:', emailError)
      return new Response(JSON.stringify({ error: 'Failed to save email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Insert attachments if any
    if (emailData.attachments && emailData.attachments.length > 0) {
      const attachments = emailData.attachments.map((att) => ({
        email_id: email.id,
        name: att.filename,
        type: att.contentType,
        size_kb: Math.ceil(att.size / 1024),
        content: att.content,
      }))

      const { error: attachmentError } = await supabase
        .from('email_attachments')
        .insert(attachments)

      if (attachmentError) {
        console.error('Error inserting attachments:', attachmentError)
        // Don't fail the entire request if attachments fail
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailId: email.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
