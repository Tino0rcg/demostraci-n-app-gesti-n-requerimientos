"use server"

import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:soporte@onlinedesk.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function savePushSubscriptionAction(subscription: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No autorizado' }

    // Convertir el JSON de subscripción a string para fácil guardado si es necesario, 
    // pero guardaremos como JSONB directo
    
    // Validar si ya existe
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('subscription->>endpoint', subscription.endpoint)
      .single()

    if (existing) {
      return { success: true, message: 'Ya registrado' }
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        subscription: subscription
      })

    if (error) {
        console.error("Supabase insert error:", error);
        return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Error saving push sub:", err);
    return { success: false, error: err.message }
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, url: string = '/') {
  try {
    const supabase = await createClient()
    
    // Obtener todas las suscripciones del usuario
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (error || !subs || subs.length === 0) return { success: false, message: 'No push subscriptions found' }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icon.png'
    })

    const sendPromises = subs.map(sub => 
      webpush.sendNotification(sub.subscription, payload).catch(e => {
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Si el endpoint ya no es válido, deberíamos borrarlo de la BD
          // supabase.from('push_subscriptions').delete().eq('subscription->>endpoint', sub.subscription.endpoint)
        }
        console.error('Error sending web push:', e)
      })
    )

    await Promise.all(sendPromises)
    return { success: true }
  } catch (error) {
    console.error('Error in sendPushToUser:', error)
    return { success: false, error: String(error) }
  }
}
