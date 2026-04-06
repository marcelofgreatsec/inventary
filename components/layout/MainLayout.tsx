import { createClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import styles from './MainLayout.module.css';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className={styles.layout}>
            <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
            <Sidebar />
            <div className={styles.main}>
                <Navbar userEmail={user?.email} />
                <main id="main-content" role="main" className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
