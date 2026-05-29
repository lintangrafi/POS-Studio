import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth';
import { getStoreSettings } from '@/actions/store-actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const storeSettings = await getStoreSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={session.role} userName={session.name} storeSettings={storeSettings} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
