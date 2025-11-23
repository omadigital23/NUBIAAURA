import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

/**
 * Générer un token sécurisé pour validation de commande
 */
export function generateValidationToken(orderId: string): string {
    // Token basé sur orderId + timestamp + random pour unicité
    const payload = `${orderId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
}

/**
 * Stocker le token avec expiration 24h
 */
export async function storeValidationToken(orderId: string, token: string): Promise<boolean> {
    try {
        // Option 1 : Redis (préféré si disponible)
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const redis = Redis.fromEnv();
            const key = `order:validation:${orderId}`;
            await redis.set(key, token, { ex: 86400 }); // 24h en secondes
            console.log(`[Token] Stored in Redis for order ${orderId}`);
            return true;
        }

        // Option 2 : Supabase (fallback)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const expiresAt = new Date(Date.now() + 86400000); // 24h en millisecondes

        // Supprimer les anciens tokens pour cette commande
        await supabase
            .from('order_validation_tokens')
            .delete()
            .eq('order_id', orderId);

        // Insérer le nouveau token
        const { error } = await supabase
            .from('order_validation_tokens')
            .insert({
                order_id: orderId,
                token,
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error('[Token] Error storing in Supabase:', error);
            return false;
        }

        console.log(`[Token] Stored in Supabase for order ${orderId}`);
        return true;
    } catch (error) {
        console.error('[Token] Error storing validation token:', error);
        return false;
    }
}

/**
 * Vérifier si le token est valide
 */
export async function verifyValidationToken(orderId: string, token: string): Promise<boolean> {
    try {
        // Option 1 : Redis
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const redis = Redis.fromEnv();
            const key = `order:validation:${orderId}`;
            const storedToken = await redis.get(key);
            const isValid = storedToken === token;
            console.log(`[Token] Redis verification for ${orderId}: ${isValid}`);
            return isValid;
        }

        // Option 2 : Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('order_validation_tokens')
            .select('token, expires_at, used_at')
            .eq('order_id', orderId)
            .eq('token', token)
            .single();

        if (error) {
            // Si la table n'existe pas encore, on autorise (graceful degradation)
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                console.warn(`[Token] Table not found, allowing validation (graceful degradation)`);
                return true;
            }
            console.log(`[Token] Supabase verification for ${orderId}: false (error: ${error.message})`);
            return false;
        }

        if (!data) {
            console.log(`[Token] Supabase verification for ${orderId}: false (not found)`);
            return false;
        }

        // Vérifier si déjà utilisé
        if (data.used_at) {
            console.log(`[Token] Supabase verification for ${orderId}: false (already used)`);
            return false;
        }

        // Vérifier expiration
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            console.log(`[Token] Supabase verification for ${orderId}: false (expired)`);
            return false;
        }

        console.log(`[Token] Supabase verification for ${orderId}: true`);
        return true;
    } catch (error: any) {
        console.error('[Token] Error verifying validation token:', error);
        // En cas d'erreur, on autorise (graceful degradation)
        console.warn('[Token] Allowing validation due to verification error (graceful degradation)');
        return true;
    }
}

/**
 * Invalider le token après utilisation (usage unique)
 */
export async function invalidateValidationToken(orderId: string): Promise<void> {
    try {
        // Option 1 : Redis
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const redis = Redis.fromEnv();
            const key = `order:validation:${orderId}`;
            await redis.del(key);
            console.log(`[Token] Invalidated in Redis for order ${orderId}`);
            return;
        }

        // Option 2 : Supabase - marquer comme utilisé au lieu de supprimer (pour audit)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase
            .from('order_validation_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('order_id', orderId);

        console.log(`[Token] Marked as used in Supabase for order ${orderId}`);
    } catch (error) {
        console.error('[Token] Error invalidating validation token:', error);
    }
}
