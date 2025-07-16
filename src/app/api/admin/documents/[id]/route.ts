import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/types';

// PUT - Update document status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    const { status, notes } = body;

    // Validation
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Valid status is required (PENDING, APPROVED, REJECTED)' 
      }, { status: 400 });
    }

    // Check if document exists
    const { data: existingDoc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, status')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document
    const updateData: {
      status: string;
      reviewed_by: string;
      reviewed_at: string;
      updated_at: string;
      notes?: string;
    } = {
      status,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select(`
        id,
        user_id,
        document_type,
        file_url,
        description,
        status,
        notes,
        created_at,
        reviewed_at,
        reviewed_by,
        users (
          id,
          name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Document status updated successfully',
      document 
    });

  } catch (error) {
    console.error('Error in document PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
