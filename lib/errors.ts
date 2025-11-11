/**
 * Système d'error handling standardisé
 */

import { ErrorCode, ErrorCodes } from './types/api';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Erreurs pré-définies
 */
export const Errors = {
  // Auth
  Unauthorized: () => new AppError(
    ErrorCodes.UNAUTHORIZED,
    'Non autorisé',
    401
  ),
  
  Forbidden: () => new AppError(
    ErrorCodes.FORBIDDEN,
    'Accès interdit',
    403
  ),
  
  InvalidCredentials: () => new AppError(
    ErrorCodes.INVALID_CREDENTIALS,
    'Identifiants invalides',
    401
  ),
  
  // Products
  ProductNotFound: (productId?: string) => new AppError(
    ErrorCodes.PRODUCT_NOT_FOUND,
    'Produit non trouvé',
    404,
    { productId }
  ),
  
  ProductOutOfStock: (productId: string) => new AppError(
    ErrorCodes.PRODUCT_OUT_OF_STOCK,
    'Produit en rupture de stock',
    400,
    { productId }
  ),
  
  // Orders
  OrderNotFound: (orderId?: string) => new AppError(
    ErrorCodes.ORDER_NOT_FOUND,
    'Commande non trouvée',
    404,
    { orderId }
  ),
  
  InvalidOrderData: (details?: any) => new AppError(
    ErrorCodes.INVALID_ORDER_DATA,
    'Données de commande invalides',
    400,
    details
  ),
  
  // Payments
  PaymentFailed: (reason?: string) => new AppError(
    ErrorCodes.PAYMENT_FAILED,
    'Paiement échoué',
    402,
    { reason }
  ),
  
  PaymentCancelled: () => new AppError(
    ErrorCodes.PAYMENT_CANCELLED,
    'Paiement annulé',
    400
  ),
  
  // General
  ValidationError: (details: any) => new AppError(
    ErrorCodes.VALIDATION_ERROR,
    'Erreur de validation',
    400,
    details
  ),
  
  ServerError: (message?: string) => new AppError(
    ErrorCodes.SERVER_ERROR,
    message || 'Erreur serveur',
    500
  ),
  
  RateLimitExceeded: () => new AppError(
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    'Trop de requêtes, veuillez réessayer plus tard',
    429
  ),
};

/**
 * Handler d'erreur pour les API routes
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: error.toJSON(),
      },
      { status: error.statusCode }
    );
  }
  
  // Erreur Zod
  if (error && typeof error === 'object' && 'issues' in error) {
    return Response.json(
      {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Erreur de validation',
          details: error,
          statusCode: 400,
        },
      },
      { status: 400 }
    );
  }
  
  // Erreur générique
  console.error('[API Error]', error);
  
  return Response.json(
    {
      success: false,
      error: {
        code: ErrorCodes.SERVER_ERROR,
        message: error instanceof Error ? error.message : 'Erreur serveur',
        statusCode: 500,
      },
    },
    { status: 500 }
  );
}
