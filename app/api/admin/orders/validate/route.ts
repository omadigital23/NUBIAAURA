import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyValidationToken, invalidateValidationToken } from '@/lib/order-validation-tokens';

// Initialize Supabase with service role key (same pattern as delivery route)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering (required for searchParams)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API route pour valider ou annuler une commande depuis WhatsApp
 * GET /api/admin/orders/validate?id=ORDER_ID&token=TOKEN&action=confirm|cancel
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    // Validation des paramètres
    if (!orderId || !token || !action) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Erreur</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              p { color: #7f8c8d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌</div>
              <h1>Paramètres manquants</h1>
              <p>ID de commande ou action non spécifiée.</p>
            </div>
          </body>
        </html>`,
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (action !== 'confirm' && action !== 'cancel') {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Erreur</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              p { color: #7f8c8d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌</div>
              <h1>Action invalide</h1>
              <p>L'action doit être 'confirm' ou 'cancel'.</p>
            </div>
          </body>
        </html>`,
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Vérifier le token de sécurité
    const isValidToken = await verifyValidationToken(orderId, token);
    if (!isValidToken) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Lien Invalide</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              p { color: #7f8c8d; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">🔒</div>
              <h1>Lien invalide ou expiré</h1>
              <p>Ce lien de validation n'est plus valide.</p>
              <p>Il a peut-être expiré (24h) ou a déjà été utilisé.</p>
              <p style="margin-top: 20px; font-size: 14px;">Si vous avez besoin de valider cette commande, veuillez accéder au dashboard admin.</p>
            </div>
          </body>
        </html>`,
        { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    console.log('[Validation] Fetching order:', orderId);
    // Récupérer la commande par order_number (ORD-xxx)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, status, total, delivery_duration_days, shipping_address')
      .eq('order_number', orderId)
      .single();

    if (fetchError || !order) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Erreur</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              p { color: #7f8c8d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌</div>
              <h1>Commande introuvable</h1>
              <p>La commande ${orderId} n'existe pas.</p>
            </div>
          </body>
        </html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Préparer les données de mise à jour
    const newStatus = action === 'confirm' ? 'processing' : 'cancelled';
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Si confirmation, calculer la date de livraison estimée
    // Le compte à rebours commence MAINTENANT (à la validation)
    if (action === 'confirm') {
      const deliveryDurationDays = order.delivery_duration_days || 3;
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + deliveryDurationDays);

      updateData.estimated_delivery_date = estimatedDeliveryDate.toISOString();

      console.log(`[Validation] Delivery countdown started: ${deliveryDurationDays} days from now`);
      console.log(`[Validation] Estimated delivery: ${estimatedDeliveryDate.toISOString()}`);
    }

    // Mettre à jour le statut (utiliser l'id de la commande trouvée)
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Erreur</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2c3e50; margin-bottom: 10px; }
              p { color: #7f8c8d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌</div>
              <h1>Erreur de mise à jour</h1>
              <p>Impossible de mettre à jour la commande.</p>
            </div>
          </body>
        </html>`,
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Ajouter dans delivery_tracking
    try {
      await supabase
        .from('delivery_tracking')
        .insert({
          order_id: order.id,
          status: newStatus,
          notes: `Commande ${action === 'confirm' ? 'validée' : 'annulée'} via lien WhatsApp`,
        });
      console.log(`[Validation] Tracking history added for order ${orderId}`);
    } catch (trackingErr: any) {
      console.warn(`[Validation] Warning: Failed to add tracking history:`, trackingErr?.message);
    }

    // Invalider le token après utilisation réussie (usage unique)
    await invalidateValidationToken(orderId);
    console.log(`[Validation] Token invalidated for order ${orderId}`);

    // Page de succès
    const actionText = action === 'confirm' ? 'validée' : 'annulée';
    const emoji = action === 'confirm' ? '✅' : '❌';
    const color = action === 'confirm' ? '#27ae60' : '#e74c3c';

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Commande ${actionText}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              text-align: center; 
              background: #f5f5f5; 
            }
            .container { 
              max-width: 500px; 
              margin: 50px auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            .success { 
              color: ${color}; 
              font-size: 64px; 
              margin-bottom: 20px; 
              animation: bounce 0.5s ease-in-out;
            }
            @keyframes bounce {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            h1 { 
              color: #2c3e50; 
              margin-bottom: 10px; 
            }
            .order-info { 
              background: #ecf0f1; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .order-info p { 
              margin: 5px 0; 
              color: #34495e; 
            }
            .order-info strong { 
              color: #2c3e50; 
            }
            .btn { 
              display: inline-block; 
              margin-top: 20px; 
              padding: 12px 30px; 
              background: #3498db; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              transition: background 0.3s;
            }
            .btn:hover { 
              background: #2980b9; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">${emoji}</div>
            <h1>Commande ${actionText} !</h1>
            <div class="order-info">
              <p><strong>N° de commande:</strong> ${order.order_number}</p>
              <p><strong>Montant:</strong> ${order.total.toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Nouveau statut:</strong> ${newStatus}</p>
            </div>
            <p style="color: #7f8c8d; margin-top: 20px;">
              ${action === 'confirm'
        ? 'La commande a été confirmée. Vous pouvez maintenant la préparer.'
        : 'La commande a été annulée. Le client sera notifié.'}
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" class="btn">
              Voir toutes les commandes
            </a>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );

  } catch (error) {
    console.error('Error in order validation:', error);
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Erreur</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #2c3e50; margin-bottom: 10px; }
            p { color: #7f8c8d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <h1>Erreur serveur</h1>
            <p>Une erreur inattendue s'est produite.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
