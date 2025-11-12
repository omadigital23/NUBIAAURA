import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = ContactSchema.parse(body);

    // Save to database
    const { data: submission, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        subject: validated.subject,
        message: validated.message,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // TODO: Send email notification to manager
    // await notifyManagerEmail(
    //   'Nouveau message de contact',
    //   `De: ${validated.name} (${validated.email})`,
    //   {
    //     Sujet: validated.subject,
    //     Message: validated.message,
    //     Téléphone: validated.phone || 'Non fourni',
    //   }
    // );

    return NextResponse.json(
      {
        success: true,
        message: 'Message envoyé avec succès',
        submissionId: submission.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Contact submission error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only for authenticated users (admin)
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all contact submissions
    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error: any) {
    console.error('Get contact submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
