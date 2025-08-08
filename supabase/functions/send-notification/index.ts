import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  user_id: string
  type: 'email' | 'push' | 'sms'
  channel: string
  subject?: string
  content: string
  recipient?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, type, channel, subject, content, recipient, metadata = {} }: NotificationRequest = await req.json()

    // Vérifier les préférences de notification de l'utilisateur
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!preferences) {
      throw new Error('User notification preferences not found')
    }

    // Vérifier si le type de notification est activé
    const isEnabled = type === 'email' ? preferences.email_enabled :
                     type === 'push' ? preferences.push_enabled :
                     type === 'sms' ? preferences.sms_enabled : false

    if (!isEnabled) {
      return new Response(
        JSON.stringify({ success: false, reason: 'Notification type disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier les heures silencieuses
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const quietStart = preferences.quiet_hours_start
    const quietEnd = preferences.quiet_hours_end

    if (quietStart && quietEnd && currentTime >= quietStart && currentTime <= quietEnd) {
      // Reporter la notification
      return new Response(
        JSON.stringify({ success: false, reason: 'Quiet hours active', deferred: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = { success: false }

    // Envoyer la notification selon le type
    switch (type) {
      case 'email':
        result = await sendEmailNotification(supabase, user_id, subject || '', content, recipient, metadata)
        break
      case 'push':
        result = await sendPushNotification(supabase, user_id, subject || '', content, metadata)
        break
      case 'sms':
        result = await sendSMSNotification(supabase, user_id, content, recipient, metadata)
        break
    }

    // Logger la notification
    await supabase.from('notification_logs').insert({
      user_id,
      type,
      channel,
      status: result.success ? 'sent' : 'failed',
      recipient: recipient || result.recipient,
      subject,
      content,
      metadata: { ...metadata, ...result.metadata },
      error_message: result.error
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function sendEmailNotification(
  supabase: any,
  user_id: string,
  subject: string,
  content: string,
  recipient?: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Récupérer l'email de l'utilisateur si pas fourni
    if (!recipient) {
      const { data: user } = await supabase.auth.admin.getUserById(user_id)
      recipient = user?.user?.email
    }

    if (!recipient) {
      throw new Error('No email recipient found')
    }

    // Utiliser un service d'email (exemple avec Resend)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SplitEase <noreply@splitease.app>',
        to: [recipient],
        subject,
        html: content,
        tags: [
          { name: 'category', value: metadata.category || 'notification' }
        ]
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || 'Email sending failed')
    }

    return {
      success: true,
      recipient,
      metadata: { email_id: emailResult.id }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipient
    }
  }
}

async function sendPushNotification(
  supabase: any,
  user_id: string,
  title: string,
  body: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Récupérer les tokens push de l'utilisateur
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (!tokens || tokens.length === 0) {
      throw new Error('No push tokens found for user')
    }

    // Envoyer via Firebase Cloud Messaging
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration_ids: tokens.map(t => t.token),
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        },
        data: metadata
      }),
    })

    const fcmResult = await fcmResponse.json()

    return {
      success: fcmResult.success > 0,
      metadata: { fcm_response: fcmResult },
      recipient: `${tokens.length} devices`
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function sendSMSNotification(
  supabase: any,
  user_id: string,
  message: string,
  recipient?: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Récupérer le numéro de téléphone si pas fourni
    if (!recipient) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('user_id', user_id)
        .single()
      
      recipient = profile?.phone
    }

    if (!recipient) {
      throw new Error('No phone number found')
    }

    // Utiliser un service SMS (exemple avec Twilio)
    const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
        To: recipient,
        Body: message
      }),
    })

    const smsResult = await smsResponse.json()

    if (!smsResponse.ok) {
      throw new Error(smsResult.message || 'SMS sending failed')
    }

    return {
      success: true,
      recipient,
      metadata: { sms_sid: smsResult.sid }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipient
    }
  }
}