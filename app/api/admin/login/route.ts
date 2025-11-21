import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminToken } from '@/lib/auth-admin';
import { z } from 'zod';
import { adminRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import { sanitizeText } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

// Schéma de validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username requis'),
  password: z.string().min(1, 'Password requis'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (stricter for admin)
    if (adminRateLimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, remaining, reset } = await adminRateLimit.limit(identifier);

      if (!success) {
        console.warn(`[Admin] Rate limit exceeded for ${identifier}`);

        const response = NextResponse.json(
          {
            error: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques instants.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          { status: 429 }
        );

        addRateLimitHeaders(response.headers, { limit, remaining, reset });
        return response;
      }

      const response = await handleAdminLogin(request);
      addRateLimitHeaders(response.headers, { limit, remaining, reset });
      return response;
    }

    return await handleAdminLogin(request);
  } catch (error: any) {
    console.error('❌ Erreur lors de la connexion admin:', error);
    Sentry.captureException(error, {
      tags: { route: 'admin/login' },
    });

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

async function handleAdminLogin(request: NextRequest) {
  const body = await request.json();

  // Sanitize username
  const sanitizedBody = {
    ...body,
    username: sanitizeText(body.username),
  };

  // Valider les données
  const { username, password } = loginSchema.parse(sanitizedBody);

  // Vérifier les identifiants
  if (!verifyAdminCredentials(username, password)) {
    console.warn(`❌ Tentative de connexion admin échouée pour: ${username}`);
    return NextResponse.json(
      { error: 'Identifiants invalides' },
      { status: 401 }
    );
  }

  // Créer un token
  const token = createAdminToken(username);

  console.log(`✅ Connexion admin réussie pour: ${username}`);

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
}

