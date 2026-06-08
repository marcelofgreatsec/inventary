import MainLayout from '@/components/layout/MainLayout';
import InfosecPage from '@/modules/infosec/InfosecPage';

export const metadata = { title: 'InfoSec — Inventary' };

export default function Page() {
    return (
        <MainLayout>
            <InfosecPage />
        </MainLayout>
    );
}
