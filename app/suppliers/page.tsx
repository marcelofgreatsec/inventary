import MainLayout from '@/components/layout/MainLayout';
import SuppliersPage from '@/modules/suppliers/SuppliersPage';

export const metadata = { title: 'Suppliers — Inventary' };

export default function Page() {
    return (
        <MainLayout>
            <SuppliersPage />
        </MainLayout>
    );
}
