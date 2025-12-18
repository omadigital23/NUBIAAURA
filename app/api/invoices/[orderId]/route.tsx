import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, InvoiceData } from '@/lib/pdf/invoice-template';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;

        // Get auth token
        let token = request.cookies.get('sb-auth-token')?.value;
        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get order with items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            name_fr
          )
        )
      `)
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Parse shipping address
        const shippingAddress = order.shipping_address || {};

        // Prepare invoice data
        const invoiceData: InvoiceData = {
            orderNumber: order.order_number,
            orderDate: order.created_at,
            customer: {
                name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Client',
                email: shippingAddress.email || user.email || '',
                phone: shippingAddress.phone,
                address: shippingAddress.address || '',
                city: shippingAddress.city || '',
                country: shippingAddress.country || 'Sénégal',
            },
            items: order.order_items.map((item: any) => ({
                name: item.products?.name_fr || item.products?.name || 'Produit',
                quantity: item.quantity,
                price: item.price,
            })),
            subtotal: order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            shipping: order.shipping_method === 'express' ? 5000 : 2000,
            discount: order.discount_amount || 0,
            total: order.total,
            paymentStatus: order.payment_status,
            paymentMethod: order.shipping_method === 'cod' ? 'Paiement à la livraison' : 'Carte bancaire',
        };

        // Generate PDF
        const pdfBuffer = await renderToBuffer(<InvoiceDocument data={invoiceData} />);

        // Return PDF
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="facture-${order.order_number}.pdf"`,
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('Invoice generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
}
