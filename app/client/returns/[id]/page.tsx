import { redirect } from 'next/navigation';

type ClientReturnRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientReturnRedirect({ params }: ClientReturnRedirectProps) {
  const { id } = await params;
  redirect(`/fr/client/returns/${id}`);
}
