'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, ShoppingBag, MapPin, LogOut, Settings, ArrowRight, Loader, RotateCcw } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  order_items: any[];
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          router.push('/auth/login');
          return;
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // Get orders
        const ordersResponse = await fetch('/api/orders');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">Chargement...</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
              Bienvenue, {user?.name || user?.email}
            </h1>
            <p className="text-nubia-black/70">
              Gérez votre compte et vos commandes
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-lg p-6">
              <User className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-semibold text-nubia-black mb-2">Profil</h3>
              <p className="text-sm text-nubia-black/70 mb-4">{user?.email}</p>
              <Link
                href="/client/profile"
                className="text-sm text-nubia-gold hover:underline flex items-center gap-1"
              >
                Modifier <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-lg p-6">
              <ShoppingBag className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-semibold text-nubia-black mb-2">Commandes</h3>
              <p className="text-2xl font-bold text-nubia-gold mb-4">{orders.length}</p>
              <Link
                href="/client/orders"
                className="text-sm text-nubia-gold hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-lg p-6">
              <RotateCcw className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-semibold text-nubia-black mb-2">{t('dashboard.returns', 'Retours')}</h3>
              <p className="text-sm text-nubia-black/70 mb-4">{t('dashboard.manage_returns', 'Gérer vos retours')}</p>
              <Link
                href="/client/returns"
                className="text-sm text-nubia-gold hover:underline flex items-center gap-1"
              >
                Voir <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-lg p-6">
              <MapPin className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-semibold text-nubia-black mb-2">{t('dashboard.addresses', 'Adresses')}</h3>
              <p className="text-sm text-nubia-black/70 mb-4">{t('dashboard.manage_addresses', 'Gérer vos adresses')}</p>
              <Link
                href="/client/addresses"
                className="text-sm text-nubia-gold hover:underline flex items-center gap-1"
              >
                Gérer <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-lg p-6">
              <Settings className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-semibold text-nubia-black mb-2">Paramètres</h3>
              <p className="text-sm text-nubia-black/70 mb-4">Préférences</p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <LogOut size={14} /> {t('nav.logout', 'Déconnexion')}
              </button>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="font-playfair text-3xl font-bold text-nubia-black mb-6">
              Commandes Récentes
            </h2>

            {orders.length === 0 ? (
              <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-12 text-center">
                <ShoppingBag className="text-nubia-gold/30 mx-auto mb-4" size={48} />
                <p className="text-nubia-black/70 mb-6">
                  Vous n'avez pas encore de commandes
                </p>
                <Link
                  href="/catalogue"
                  className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
                >
                  Commencer vos achats
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/client/orders/${order.id}`}
                    className="block border border-nubia-gold/20 rounded-lg p-6 hover:bg-nubia-gold/5 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-nubia-black">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-nubia-black/70">
                          {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-nubia-gold">
                          {order.total.toLocaleString('fr-FR')} FCFA
                        </p>
                        <span className="inline-block text-xs px-3 py-1 bg-nubia-gold/20 text-nubia-gold rounded-full mt-2">
                          {order.status === 'pending' && 'En attente'}
                          {order.status === 'processing' && 'En traitement'}
                          {order.status === 'shipped' && 'Expédiée'}
                          {order.status === 'delivered' && 'Livrée'}
                          {order.status === 'cancelled' && 'Annulée'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-nubia-black/70">
                        {order.order_items?.length || 0} article(s)
                      </p>
                      <ArrowRight className="text-nubia-gold" size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
