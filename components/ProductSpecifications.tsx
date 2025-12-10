'use client';

import { useTranslation } from '@/hooks/useTranslation';

type Spec = {
  label: string;
  value: string;
};

export default function ProductSpecifications({ specs }: { specs?: Spec[] }) {
  const { t } = useTranslation();

  if (!specs || specs.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-nubia-gold/20 pt-8">
      <h3 className="font-semibold text-lg text-nubia-black mb-4">
        {t('product.specifications', 'Spécifications')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specs.map((spec, index) => (
          <div key={index} className="flex justify-between items-start">
            <span className="text-nubia-black/70">{spec.label}</span>
            <span className="font-semibold text-nubia-black">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
