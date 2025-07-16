import { supabase } from '@/lib/supabase';
import { notifyUsersAboutNewScheme } from '@/lib/whatsapp-new';

/**
 * Initialize WhatsApp notification trigger for new schemes
 * This should be called once when the application starts
 */
export function initializeWhatsAppTrigger() {
  console.log('🚀 Initializing WhatsApp notification trigger...');

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
        console.log('📢 New scheme detected for WhatsApp notifications:', payload.new);
        
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
          console.error('❌ Error processing WhatsApp notification for new scheme:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('📱 WhatsApp notification trigger status:', status);
    });

  return channel;
}

/**
 * Manually trigger WhatsApp notifications for a scheme
 * This can be used for testing or manual notifications
 */
export async function manuallyTriggerSchemeNotification(schemeId: string) {
  try {
    console.log('🔧 Manually triggering WhatsApp notification for scheme:', schemeId);

    // Fetch scheme details
    const { data: scheme, error } = await supabase
      .from('schemes')
      .select('*')
      .eq('id', schemeId)
      .single();

    if (error) {
      console.error('Error fetching scheme for manual notification:', error);
      return false;
    }

    if (!scheme) {
      console.error('Scheme not found for manual notification');
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
    console.error('Error in manual WhatsApp notification trigger:', error);
    return false;
  }
}
