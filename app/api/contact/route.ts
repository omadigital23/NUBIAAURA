import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendEmail } from '@/lib/smtp-email';
import { getContactConfirmationEmail, getContactManagerNotification } from '@/lib/email-templates';
import { notifyManagerNewContact } from '@/lib/whatsapp-notifications';
import { checkRateLimit, formRatelimit } from '@/lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(2, 'Le sujet doit contenir au moins 2 caractères'),
  message: z.string().min(5, 'Le message doit contenir au moins 5 caractères'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'global';
    const rl = await checkRateLimit(`contact:${String(ip).split(',')[0].trim()}`, formRatelimit);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de messages. Veuillez réessayer dans quelques instants.' },
        { status: 429 }
      );
    }

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

    // Envoyer email de confirmation au client
    try {
      const confirmationEmail = getContactConfirmationEmail(validated);
      await sendEmail({
        to: validated.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
    }

    // Envoyer notification au manager (Email)
    try {
      const managerEmail = process.env.MANAGER_EMAIL || 'contact@nubiaaura.com';
      const managerNotification = getContactManagerNotification(validated);
      await sendEmail({
        to: managerEmail,
        subject: managerNotification.subject,
        html: managerNotification.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email manager:', emailError);
    }

    // Envoyer notification au manager (WhatsApp)
    try {
      await notifyManagerNewContact({
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
      });
    } catch (whatsappError) {
      console.error('Erreur notification WhatsApp:', whatsappError);
    }

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
