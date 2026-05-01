import { redirect } from 'next/navigation';

type ClientOrderRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientOrderRedirect({ params }: ClientOrderRedirectProps) {
  const { id } = await params;
  redirect(`/fr/client/orders/${id}`);
}
