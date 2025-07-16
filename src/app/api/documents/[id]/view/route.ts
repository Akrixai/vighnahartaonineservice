import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - View document with proper public URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    // Get document from database
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        user_id,
        document_type,
        file_url,
        description,
        status,
        notes,
        created_at
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      document.user_id === session.user.id ||
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.EMPLOYEE;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this document' 
      }, { status: 403 });
    }

    // Extract file path from the stored URL
    let filePath = document.file_url;
    let publicUrl = document.file_url;

    // If the file_url is already a full URL, extract the path
    if (document.file_url.includes('supabase')) {
      const urlParts = document.file_url.split('/storage/v1/object/public/documents/');
      if (urlParts.length > 1) {
        filePath = urlParts[1];
      }
    }

    // Get fresh public URL from Supabase storage
    try {
      const { data: urlData } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
      }
    } catch (storageError) {
      console.error('Error getting public URL:', storageError);
      // Fall back to stored URL if storage access fails
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        public_url: publicUrl,
        file_url: publicUrl // Update file_url to the fresh public URL
      }
    });

  } catch (error) {
    console.error('Error viewing document:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
