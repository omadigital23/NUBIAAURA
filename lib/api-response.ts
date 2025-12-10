/**
 * Helpers pour les réponses API standardisées
 */

import { NextResponse } from 'next/server';
import type { ApiResponse, ApiError } from './types/api';

/**
 * Réponse de succès
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Réponse d'erreur
 */
export function errorResponse(
  error: ApiError,
  status?: number
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: status || error.statusCode }
  );
}

/**
 * Réponse de validation error
 */
export function validationErrorResponse(
  details: any
): NextResponse<ApiResponse> {
  return errorResponse({
    code: 'VALIDATION_ERROR',
    message: 'Erreur de validation',
    details,
    statusCode: 400,
  });
}

/**
 * Réponse not found
 */
export function notFoundResponse(
  message: string = 'Ressource non trouvée'
): NextResponse<ApiResponse> {
  return errorResponse({
    code: 'NOT_FOUND',
    message,
    statusCode: 404,
  });
}

/**
 * Réponse unauthorized
 */
export function unauthorizedResponse(
  message: string = 'Non autorisé'
): NextResponse<ApiResponse> {
  return errorResponse({
    code: 'UNAUTHORIZED',
    message,
    statusCode: 401,
  });
}

/**
 * Réponse forbidden
 */
export function forbiddenResponse(
  message: string = 'Accès interdit'
): NextResponse<ApiResponse> {
  return errorResponse({
    code: 'FORBIDDEN',
    message,
    statusCode: 403,
  });
}

/**
 * Réponse server error
 */
export function serverErrorResponse(
  message: string = 'Erreur serveur',
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse({
    code: 'SERVER_ERROR',
    message,
    details,
    statusCode: 500,
  });
}
