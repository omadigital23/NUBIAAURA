import { getSupabaseServerClient } from '@/lib/supabase';
import { CheckoutData, CODOrder } from './checkout-validation';

export interface CreateOrderResult {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
}

/**
 * Crée une commande de manière atomique
 * 1. Crée la commande
 * 2. Crée les articles de commande
 * 3. Réduit le stock
 * 4. Vide le panier
 */
export async function createOrder(
  userId: string,
  checkoutData: CheckoutData
): Promise<CreateOrderResult> {
  const supabase = getSupabaseServerClient();
  let order: any = null; // Declare outside try-catch for access in finally

  try {
    // Calculer le total
    const total = checkoutData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Transaction atomique
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD-${Date.now()}`,
        total,
        status: 'pending',
        payment_status: 'pending',
        shipping_method: checkoutData.shippingMethod,
        shipping_address: checkoutData.address,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(orderError?.message || 'Failed to create order');
    }

    order = orderData; // Assign to outer variable

    // Créer les articles de commande
    const orderItems = checkoutData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Supprimer la commande créée
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(itemsError.message || 'Failed to create order items');
    }

    // Réduire le stock pour chaque produit
    for (const item of checkoutData.items) {
      // Récupérer les variantes du produit
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, stock')
        .eq('product_id', item.product_id);

      if (variantsError) {
        throw new Error(variantsError.message || 'Failed to fetch product variants');
      }

      // Réduire le stock de chaque variante
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const newStock = Math.max(0, (variant.stock || 0) - item.quantity);
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', variant.id);

          if (updateError) {
            throw new Error(updateError.message || 'Failed to update stock');
          }
        }
      }

      // Aussi mettre à jour le flag inStock du produit
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const { data: updatedVariants } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('product_id', item.product_id);

        const totalStock = updatedVariants?.reduce(
          (sum, v) => sum + (v.stock || 0),
          0
        ) || 0;

        const { error: productError } = await supabase
          .from('products')
          .update({ inStock: totalStock > 0 })
          .eq('id', item.product_id);

        if (productError) {
          throw new Error(productError.message || 'Failed to update product stock status');
        }
      }
    }

    // Vider le panier
    const { error: cartError } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (cartError) {
      console.error('Warning: Failed to clear cart:', cartError);
      // Ne pas échouer si le panier ne peut pas être vidé
    }

    return {
      id: order.id,
      user_id: order.user_id,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  } finally {
    // Send notification asynchronously (don't block order creation)
    // This runs after the order is created successfully
    if (order?.id) {
      // Import dynamically to avoid circular dependencies
      import('@/lib/services/order-notifications').then(async ({ sendNewOrderNotification, formatCustomerName, extractCustomerContact }) => {
        try {
          const customerName = formatCustomerName(checkoutData.address);
          const { email, phone } = extractCustomerContact(checkoutData.address);

          await sendNewOrderNotification({
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            customerEmail: email,
            customerPhone: phone,
            total: order.total,
            itemCount: checkoutData.items.length,
            shippingMethod: checkoutData.shippingMethod,
          });
        } catch (notifError) {
          // Log but don't throw - notification failure shouldn't affect order
          console.error('Failed to send order notification:', notifError);
        }
      });
    }
  }
}

/**
 * Crée une commande COD (Cash on Delivery)
 */
export async function createCODOrder(
  userId: string,
  codData: CODOrder
): Promise<CreateOrderResult> {
  const supabase = getSupabaseServerClient();
  let order: any = null; // Declare outside try-catch for access in finally

  try {
    // Calculer le total
    const total = codData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Créer la commande
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD-${Date.now()}`,
        total,
        status: 'pending',
        payment_status: 'pending',
        shipping_method: codData.shippingMethod,
        shipping_address: {
          firstName: codData.firstName,
          lastName: codData.lastName,
          email: codData.email,
          phone: codData.phone,
          address: codData.address,
          city: codData.city,
          zipCode: codData.zipCode,
          country: codData.country,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(orderError?.message || 'Failed to create order');
    }

    order = orderData; // Assign to outer variable

    // Créer les articles de commande
    const orderItems = codData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(itemsError.message || 'Failed to create order items');
    }

    // Réduire le stock
    for (const item of codData.items) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, stock')
        .eq('product_id', item.product_id);

      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const newStock = Math.max(0, (variant.stock || 0) - item.quantity);
          await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', variant.id);
        }
      }

      // Mettre à jour le flag inStock
      const { data: updatedVariants } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', item.product_id);

      const totalStock = updatedVariants?.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      ) || 0;

      await supabase
        .from('products')
        .update({ inStock: totalStock > 0 })
        .eq('id', item.product_id);
    }

    // Vider le panier
    await supabase.from('carts').delete().eq('user_id', userId);

    return {
      id: order.id,
      user_id: order.user_id,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    };
  } catch (error) {
    console.error('COD order creation failed:', error);
    throw error;
  } finally {
    // Send notification asynchronously for COD orders
    if (order?.id) {
      import('@/lib/services/order-notifications').then(async ({ sendNewOrderNotification }) => {
        try {
          await sendNewOrderNotification({
            orderId: order.id,
            orderNumber: order.order_number,
            customerName: `${codData.firstName} ${codData.lastName}`,
            customerEmail: codData.email,
            customerPhone: codData.phone,
            total: order.total,
            itemCount: codData.items.length,
            shippingMethod: codData.shippingMethod,
          });
        } catch (notifError) {
          console.error('Failed to send COD order notification:', notifError);
        }
      });
    }
  }
}

/**
 * Vérifie le stock avant de créer une commande
 */
export async function verifyStock(items: Array<{ product_id: string; quantity: number }>) {
  const supabase = getSupabaseServerClient();

  for (const item of items) {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, inStock, product_variants(stock)')
      .eq('id', item.product_id)
      .single();

    if (error || !product) {
      throw new Error(`Product ${item.product_id} not found`);
    }

    if (!product.inStock) {
      throw new Error(`Product ${item.product_id} is out of stock`);
    }

    const totalStock = (product.product_variants as any[])?.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    ) || 0;

    if (totalStock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${item.product_id}. Available: ${totalStock}, Requested: ${item.quantity}`
      );
    }
  }
}
