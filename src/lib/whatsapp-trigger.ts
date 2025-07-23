import { supabase } from '@/lib/supabase';
import { notifyUsersAboutNewScheme } from '@/lib/whatsapp-new';

/**
 * Initialize WhatsApp notification trigger for new schemes
 * This should be called once when the application starts
 */
export function initializeWhatsAppTrigger() {
  // Listen for new schemes created by admin
  const channel = supabase
    .channel('whatsapp-scheme-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'schemes'
      },
      async (payload) => {
        try {
          const scheme = payload.new;
          
          // Only send notifications for active schemes
          if (scheme.is_active) {
            await notifyUsersAboutNewScheme(
              scheme.id,
              scheme.name,
              scheme.description || 'New service available on our portal'
            );
          }
        } catch (error) {
          // All console.log and console.error statements removed
        }
      }
    )
    .subscribe((status) => {
      // All console.log and console.error statements removed
    });

  return channel;
}

/**
 * Manually trigger WhatsApp notifications for a scheme
 * This can be used for testing or manual notifications
 */
export async function manuallyTriggerSchemeNotification(schemeId: string) {
  try {
    // Fetch scheme details
    const { data: scheme, error } = await supabase
      .from('schemes')
      .select('*')
      .eq('id', schemeId)
      .single();

    if (error) {
      return false;
    }

    if (!scheme) {
      return false;
    }

    // Send notifications
    await notifyUsersAboutNewScheme(
      scheme.id,
      scheme.name,
      scheme.description || 'New service available on our portal'
    );

    return true;
  } catch (error) {
    return false;
  }
}
