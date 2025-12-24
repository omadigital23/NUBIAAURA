import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test-callmebot
 * Test la configuration CallMeBot et envoie un message de test
 */
export async function GET(request: NextRequest) {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const managerPhone = process.env.MANAGER_WHATSAPP;

    console.log('[TEST CallMeBot] Starting test...');
    console.log('[TEST CallMeBot] CALLMEBOT_API_KEY:', apiKey ? `${apiKey.substring(0, 3)}*** (length: ${apiKey.length})` : 'NOT SET');
    console.log('[TEST CallMeBot] MANAGER_WHATSAPP:', managerPhone ? `${managerPhone.substring(0, 5)}*** (length: ${managerPhone.length})` : 'NOT SET');

    // Vérification des variables
    if (!apiKey) {
        return NextResponse.json({
            success: false,
            error: 'CALLMEBOT_API_KEY non configuré',
            env_status: {
                CALLMEBOT_API_KEY: false,
                MANAGER_WHATSAPP: !!managerPhone,
            }
        }, { status: 400 });
    }

    if (!managerPhone) {
        return NextResponse.json({
            success: false,
            error: 'MANAGER_WHATSAPP non configuré',
            env_status: {
                CALLMEBOT_API_KEY: true,
                MANAGER_WHATSAPP: false,
            }
        }, { status: 400 });
    }

    // Nettoyer le numéro
    const cleanPhone = managerPhone.replace(/[^0-9]/g, '');

    // Message simple de test
    const testMessage = `Test NUBIA AURA - ${new Date().toLocaleString('fr-FR')}`;
    const encodedMessage = encodeURIComponent(testMessage);

    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

    console.log('[TEST CallMeBot] Clean phone:', cleanPhone);
    console.log('[TEST CallMeBot] URL (sans apikey):', url.replace(apiKey, '***'));

    try {
        const response = await fetch(url, { method: 'GET' });
        const responseText = await response.text();

        console.log('[TEST CallMeBot] Response status:', response.status);
        console.log('[TEST CallMeBot] Response body:', responseText);

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: `CallMeBot error: ${response.status}`,
                response: responseText,
                debug: {
                    phoneUsed: cleanPhone,
                    status: response.status,
                }
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Notification WhatsApp envoyée!',
            debug: {
                phoneUsed: cleanPhone,
                status: response.status,
                response: responseText,
            }
        });

    } catch (error: any) {
        console.error('[TEST CallMeBot] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
