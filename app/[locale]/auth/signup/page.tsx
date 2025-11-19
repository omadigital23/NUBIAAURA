'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader } from 'lucide-react';
import SignUpFormClient from '@/app/auth/signup/client';

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <Loader className="animate-spin text-nubia-gold" size={40} />
  </div>
);

export default function LocaleSignUpPage() {
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <SignUpFormClient />
      </Suspense>
      <Footer />
    </div>
  );
}
