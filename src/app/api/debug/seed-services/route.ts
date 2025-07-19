import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ message: 'Use POST to seed services' });
}

export async function POST() {
  try {
    // Get the first admin user to use as created_by, or create a default one
    let { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1)
      .single();

    let createdBy = adminUser?.id;

    // If no admin user exists, create a default one for seeding
    if (!createdBy) {
      const { data: newAdmin } = await supabaseAdmin
        .from('users')
        .insert({
          email: 'admin@system.com',
          name: 'System Admin',
          role: 'ADMIN',
          password_hash: '$2a$10$dummy.hash.for.seeding.purposes.only',
          is_active: true,
          phone: '0000000000'
        })
        .select('id')
        .single();

      createdBy = newAdmin?.id;
    }

    // Sample services data
    const sampleServices = [
      // Government Services
      {
        name: 'PAN Card Application',
        description: 'Apply for new PAN card or update existing PAN card details. Required for income tax purposes.',
        price: 100,
        is_free: false,
        category: 'identity_documents',
        documents: ['Aadhaar Card', 'Address Proof', 'Date of Birth Proof', 'Passport Size Photo'],
        processing_time_days: 15,
        commission_rate: 10,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Birth Certificate',
        description: 'Official birth certificate issued by municipal corporation. Required for various government services.',
        price: 50,
        is_free: false,
        category: 'certificates',
        documents: ['Hospital Birth Certificate', 'Parents Aadhaar Card', 'Address Proof'],
        processing_time_days: 10,
        commission_rate: 15,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Income Certificate',
        description: 'Certificate showing annual income. Required for various government schemes and admissions.',
        price: 30,
        is_free: false,
        category: 'certificates',
        documents: ['Aadhaar Card', 'Salary Certificate', 'Bank Statement', 'Address Proof'],
        processing_time_days: 7,
        commission_rate: 20,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Caste Certificate',
        description: 'Official caste certificate for reservation benefits in education and employment.',
        price: 40,
        is_free: false,
        category: 'certificates',
        documents: ['Aadhaar Card', 'Family Caste Certificate', 'Address Proof', 'School Certificate'],
        processing_time_days: 12,
        commission_rate: 15,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Domicile Certificate',
        description: 'Certificate proving residence in the state. Required for state quota admissions and jobs.',
        price: 35,
        is_free: false,
        category: 'certificates',
        documents: ['Aadhaar Card', 'Residence Proof', 'School Certificate', 'Voter ID'],
        processing_time_days: 10,
        commission_rate: 18,
        is_active: true,
        created_by: createdBy
      },
      {
        name: '10th Marksheet Verification',
        description: 'Verification and duplicate copy of 10th standard marksheet from education board.',
        price: 75,
        is_free: false,
        category: 'educational',
        documents: ['Original Marksheet', 'Aadhaar Card', 'School Leaving Certificate'],
        processing_time_days: 20,
        commission_rate: 12,
        is_active: true,
        created_by: createdBy
      },
      {
        name: '12th Marksheet Verification',
        description: 'Verification and duplicate copy of 12th standard marksheet from education board.',
        price: 85,
        is_free: false,
        category: 'educational',
        documents: ['Original Marksheet', 'Aadhaar Card', 'College Admission Receipt'],
        processing_time_days: 25,
        commission_rate: 12,
        is_active: true,
        created_by: createdBy
      },
      // Other Services
      {
        name: 'Passport Application',
        description: 'Apply for new passport or renewal of existing passport. Complete assistance provided.',
        price: 200,
        is_free: false,
        category: 'travel_documents',
        documents: ['Aadhaar Card', 'Address Proof', 'Date of Birth Proof', 'Passport Size Photos'],
        processing_time_days: 30,
        commission_rate: 8,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Driving License',
        description: 'Apply for new driving license or renewal. Includes learning license and permanent license.',
        price: 150,
        is_free: false,
        category: 'transport',
        documents: ['Aadhaar Card', 'Address Proof', 'Age Proof', 'Medical Certificate', 'Passport Photos'],
        processing_time_days: 21,
        commission_rate: 10,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Voter ID Card',
        description: 'Apply for new voter ID card or update existing details. Essential for voting rights.',
        price: 0,
        is_free: true,
        category: 'identity_documents',
        documents: ['Aadhaar Card', 'Address Proof', 'Age Proof', 'Passport Size Photo'],
        processing_time_days: 14,
        commission_rate: 25,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Ration Card',
        description: 'Apply for new ration card or add/remove family members. Required for subsidized food grains.',
        price: 25,
        is_free: false,
        category: 'welfare',
        documents: ['Aadhaar Card', 'Address Proof', 'Income Certificate', 'Family Photos'],
        processing_time_days: 18,
        commission_rate: 20,
        is_active: true,
        created_by: createdBy
      },
      {
        name: 'Property Registration',
        description: 'Complete property registration and documentation services. Legal assistance included.',
        price: 500,
        is_free: false,
        category: 'legal',
        documents: ['Property Documents', 'Aadhaar Card', 'PAN Card', 'Address Proof', 'NOC'],
        processing_time_days: 45,
        commission_rate: 5,
        is_active: true,
        created_by: createdBy
      }
    ];

    // Insert services into database
    const { data, error } = await supabaseAdmin
      .from('schemes')
      .insert(sampleServices)
      .select();

    if (error) {
      console.error('Error inserting sample services:', error);
      return NextResponse.json({ error: 'Failed to insert sample services' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully inserted ${data.length} sample services`,
      services: data
    });

  } catch (error) {
    console.error('Error in seed-services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
