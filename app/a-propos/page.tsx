import { redirect } from 'next/navigation';

export default function AboutPage() {
  // Redirect to French version by default
  redirect('/fr/a-propos');
}
