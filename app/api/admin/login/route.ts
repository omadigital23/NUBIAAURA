import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminToken } from '@/lib/auth-admin';
import { z } from 'zod';

// Schéma de validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username requis'),
  password: z.string().min(1, 'Password requis'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valider les données
    const { username, password } = loginSchema.parse(body);

    // Vérifier les identifiants
    if (!verifyAdminCredentials(username, password)) {
      console.warn(`❌ Tentative de connexion échouée pour: ${username}`);
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Créer un token
    const token = createAdminToken(username);

    // Retourner le token
    return NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        token,
        username,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erreur lors de la connexion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
