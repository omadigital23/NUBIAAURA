import { redirect } from 'next/navigation';

type CategoryRedirectProps = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const query = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined) query.append(key, entry);
      });
      return;
    }

    if (value !== undefined) query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export default async function CategoryRedirect({ params, searchParams }: CategoryRedirectProps) {
  const { category } = await params;
  redirect(`/fr/catalogue/${category}${toQueryString(await searchParams)}`);
}
