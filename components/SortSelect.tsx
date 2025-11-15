'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

const sortOptions = [
  { value: 'rating', label: 'catalog.sort_rating' },
  { value: 'newest', label: 'catalog.newest' },
  { value: 'price_asc', label: 'catalog.price_asc' },
  { value: 'price_desc', label: 'catalog.price_desc' },
] as const;

type SortOption = typeof sortOptions[number]['value'];

export function SortSelect() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const sort = searchParams.get('sort') as SortOption || 'rating';
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSort === 'rating') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      className="px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold bg-white"
      value={sort}
      onChange={handleSortChange}
      aria-label={t('catalog.sort_by', 'Trier par')}
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {t(option.label, option.label.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}
        </option>
      ))}
    </select>
  );
}
