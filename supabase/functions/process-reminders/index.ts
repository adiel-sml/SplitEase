import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Processing reminders...')

    // Récupérer tous les rappels à traiter
    const { data: reminders, error } = await supabase
      .from('reminder_schedules')
      .select(`
        *,
        groups (
          id,
          name,
          members (
            id,
            name,
            email,
            user_id
          ),
          expenses (
            id,
            description,
            amount,
            paid_by,
            expense_splits (
              member_id,
              amount
            )
          )
        )
      `)
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString())

    if (error) {
      throw error
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`)

    const results = []

    for (const reminder of reminders || []) {
      try {
        const result = await processReminder(supabase, reminder)
        results.push(result)

        // Mettre à jour la prochaine exécution
        const nextRun = calculateNextRun(reminder.frequency)
        await supabase
          .from('reminder_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRun.toISOString()
          })
          .eq('id', reminder.id)

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
        results.push({
          reminder_id: reminder.id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Reminder processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processReminder(supabase: any, reminder: any) {
  const { groups: group } = reminder

  if (!group) {
    throw new Error('Group not found')
  }

  // Calculer les soldes
  const balances = calculateBalances(group)
  
  // Trouver les débiteurs
  const debtors = balances.filter(b => b.balance < -0.01)

  if (debtors.length === 0) {
    return {
      reminder_id: reminder.id,
      success: true,
      message: 'No debts to remind about'
    }
  }

  const notifications = []

  for (const debtor of debtors) {
    const member = group.members.find((m: any) => m.id === debtor.memberId)
    
    if (!member?.user_id || !member?.email) {
      continue
    }

    // Créer le contenu du rappel
    const content = generateReminderContent(group, member, debtor.balance, balances)

    // Envoyer la notification
    const notificationResult = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: member.user_id,
        type: 'email',
        channel: 'debt_reminder',
        subject: `💰 Rappel de remboursement - ${group.name}`,
        content: content.html,
        recipient: member.email,
        metadata: {
          group_id: group.id,
          debt_amount: Math.abs(debtor.balance),
          reminder_type: reminder.reminder_type
        }
      }
    })

    notifications.push({
      member_id: member.id,
      email: member.email,
      debt_amount: Math.abs(debtor.balance),
      notification_sent: notificationResult.data?.success || false,
      error: notificationResult.error?.message
    })
  }

  return {
    reminder_id: reminder.id,
    success: true,
    group_id: group.id,
    notifications_sent: notifications.filter(n => n.notification_sent).length,
    total_debtors: debtors.length,
    notifications
  }
}

function calculateBalances(group: any) {
  const balances: Record<string, number> = {}
  
  // Initialiser les soldes
  group.members.forEach((member: any) => {
    balances[member.id] = 0
  })

  // Calculer les soldes à partir des dépenses
  group.expenses.forEach((expense: any) => {
    // Ajouter le montant payé
    balances[expense.paid_by] += expense.amount

    // Soustraire les parts dues
    expense.expense_splits.forEach((split: any) => {
      balances[split.member_id] -= split.amount
    })
  })

  return group.members.map((member: any) => ({
    memberId: member.id,
    memberName: member.name,
    balance: Math.round(balances[member.id] * 100) / 100
  }))
}

function generateReminderContent(group: any, member: any, debtAmount: number, allBalances: any[]) {
  const creditors = allBalances.filter(b => b.balance > 0.01)
  const formatCurrency = (amount: number) => `${amount.toFixed(2)}€`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rappel de remboursement - SplitEase</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .debt-amount { font-size: 24px; font-weight: bold; color: #ef4444; }
        .creditor { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #10b981; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Rappel de remboursement</h1>
          <p>Groupe: <strong>${group.name}</strong></p>
        </div>
        <div class="content">
          <p>Bonjour ${member.name},</p>
          
          <p>Vous avez actuellement une dette de <span class="debt-amount">${formatCurrency(Math.abs(debtAmount))}</span> dans le groupe "${group.name}".</p>
          
          <h3>💳 Personnes à rembourser :</h3>
          ${creditors.map(creditor => `
            <div class="creditor">
              <strong>${creditor.memberName}</strong><br>
              Montant à recevoir : <strong>${formatCurrency(creditor.balance)}</strong>
            </div>
          `).join('')}
          
          <p>Pour équilibrer les comptes rapidement, vous pouvez :</p>
          <ul>
            <li>Effectuer les remboursements et les marquer comme payés dans l'app</li>
            <li>Ajouter de nouvelles dépenses pour compenser</li>
            <li>Discuter avec les membres du groupe pour trouver un arrangement</li>
          </ul>
          
          <a href="${Deno.env.get('FRONTEND_URL')}/group/${group.id}" class="button">
            Voir le groupe sur SplitEase
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Ce rappel est envoyé automatiquement selon vos préférences de notification. 
            Vous pouvez modifier la fréquence dans les paramètres de votre compte.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return { html }
}

function calculateNextRun(frequency: string): Date {
  const now = new Date()
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly':
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}