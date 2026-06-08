import MainLayout from '@/components/layout/MainLayout';
import ArchivePage from '@/modules/archive/ArchivePage';

export const metadata = { title: 'Archive — Inventary' };

export default function Page() {
    return (
        <MainLayout>
            <ArchivePage />
        </MainLayout>
    );
}
