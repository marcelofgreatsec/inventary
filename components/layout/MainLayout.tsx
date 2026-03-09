import { createClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import styles from './MainLayout.module.css';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                <Navbar userEmail={user?.email} />
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
