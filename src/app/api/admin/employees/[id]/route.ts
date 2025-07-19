import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import bcrypt from 'bcryptjs';

// PATCH - Update employee (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = params.id;
    const { name, email, phone, password, employee_id, department, is_active } = await request.json();

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', employeeId)
      .eq('role', 'EMPLOYEE')
      .single();

    if (fetchError || !existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingEmployee.email) {
      const { data: emailExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', employeeId)
        .single();

      if (emailExists) {
        return NextResponse.json({ 
          error: 'Email already exists' 
        }, { status: 400 });
      }
    }

    const updateData: {
      updated_at: string;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (employee_id !== undefined) updateData.employee_id = employee_id || null;
    if (department !== undefined) updateData.department = department || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Hash new password if provided
    if (password) {
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    const { data: updatedEmployee, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }

    return NextResponse.json(updatedEmployee);

  } catch (error) {
    console.error('Error in employee PATCH:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete employee (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = params.id;

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', employeeId)
      .eq('role', 'EMPLOYEE')
      .single();

    if (fetchError || !existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Delete employee
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', employeeId);

    if (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Employee deleted successfully' });

  } catch (error) {
    console.error('Error in employee DELETE:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
