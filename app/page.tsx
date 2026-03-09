import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/modules/dashboard/Dashboard';

export default function HomePage() {
    return (
        <MainLayout>
            <Dashboard />
        </MainLayout>
    );
}
