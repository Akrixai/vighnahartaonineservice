import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// GET - View document by ID (Admin, Employee, or document owner)
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

    // Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        user_id,
        document_type,
        file_url,
        description,
        status,
        created_at,
        users (
          id,
          name,
          email
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.EMPLOYEE ||
      document.user_id === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If file_url is a Supabase storage path, generate a signed URL
    let viewUrl = document.file_url;
    
    if (document.file_url && document.file_url.includes('supabase')) {
      try {
        // Extract the file path from the URL
        const urlParts = document.file_url.split('/');
        const bucketName = 'documents'; // Assuming documents are stored in 'documents' bucket
        const filePath = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)

        // Generate signed URL for 1 hour
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signedUrlError) {
          console.error('Error generating signed URL:', signedUrlError);
          // Fall back to original URL if signed URL generation fails
        } else {
          viewUrl = signedUrlData.signedUrl;
        }
      } catch (error) {
        console.error('Error processing file URL:', error);
        // Fall back to original URL
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        viewUrl
      }
    });

  } catch (error) {
    console.error('Error in document view API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
