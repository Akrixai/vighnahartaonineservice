import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, bucket = 'documents', expiresIn = 3600 } = await request.json();

    if (!filePath) {
      return NextResponse.json({ 
        error: 'File path is required' 
      }, { status: 400 });
    }

    // Validate bucket name
    const allowedBuckets = ['documents', 'images'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ 
        error: 'Invalid bucket name' 
      }, { status: 400 });
    }

    try {
      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
        return NextResponse.json({ 
          error: 'Failed to generate signed URL',
          details: signedUrlError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        signedUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      });

    } catch (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json({ 
        error: 'Storage service error',
        details: storageError instanceof Error ? storageError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in get-signed-url API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET method for direct file path access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'documents';
    const expiresIn = parseInt(searchParams.get('expires') || '3600');

    if (!filePath) {
      return NextResponse.json({ 
        error: 'File path is required' 
      }, { status: 400 });
    }

    // Validate bucket name
    const allowedBuckets = ['documents', 'images'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ 
        error: 'Invalid bucket name' 
      }, { status: 400 });
    }

    try {
      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
        return NextResponse.json({ 
          error: 'Failed to generate signed URL',
          details: signedUrlError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        signedUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      });

    } catch (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json({ 
        error: 'Storage service error',
        details: storageError instanceof Error ? storageError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in get-signed-url API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
