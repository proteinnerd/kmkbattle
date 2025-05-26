import dynamic from 'next/dynamic';

// Dynamically import the client component with no SSR
const ClientSupabaseStatus = dynamic(
  () => import('./ClientSupabaseStatus'),
  { ssr: false }
);

export default function SupabaseStatus() {
  return <ClientSupabaseStatus />;
} 