"use server"

import { createClient as createSupabaseJS } from '@supabase/supabase-js'
import webpush from 'web-push'

function getAdminClient() {
  return createSupabaseJS(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const vapidSubject = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:soporte@onlinedesk.com';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function getVapidPublicKeyAction() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BMsrFj0fv6tCbJ6y8-d56gfiAZTDY7AdbkUG4N0wuGfck6yLYkjaJrMXg6krqP2_qoYNysDryVJ8oJ70UFF4VF0';
  return { success: true, publicKey: key };
}

export async function savePushSubscriptionAction(subscription: any, userId?: string) {
  try {
    const supabase = getAdminClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const { createClient } = await import('@/lib/supabase/server');
      const userClient = await createClient();
      const { data: { user } } = await userClient.auth.getUser();
      targetUserId = user?.id;
    }

    if (!targetUserId) {
      return { success: false, error: 'Usuario no identificado' };
    }

    if (!subscription || !subscription.endpoint) {
      return { success: false, error: 'Suscripción inválida' };
    }

    // Comprobar si ya existe la suscripción para este endpoint
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('subscription->>endpoint', subscription.endpoint)
      .maybeSingle();

    if (existing) {
      return { success: true, message: 'Dispositivo ya registrado' };
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: targetUserId,
        subscription: subscription
      });

    if (error) {
      console.error("Error al registrar suscripción push en Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving push subscription:", err);
    return { success: false, error: err.message };
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, url: string = '/dashboard') {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured. Skipping push notification.");
    return { success: false, error: "VAPID keys not set" };
  }

  try {
    const supabase = getAdminClient();

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId);

    if (error || !subs || subs.length === 0) {
      return { success: false, message: 'Sin suscripciones push activas para este usuario' };
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/logo-online-system.png'
    });

    const sendPromises = subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Suscripción expirada o eliminada por el navegador: borrar de la BD
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
        }
        console.error('Error enviando push web a dispositivo:', e?.message || e);
      }
    });

    await Promise.all(sendPromises);
    return { success: true };
  } catch (error) {
    console.error('Error en sendPushToUser:', error);
    return { success: false, error: String(error) };
  }
}
