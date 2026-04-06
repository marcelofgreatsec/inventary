'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [mounted,  setMounted]  = useState(false);
    const router   = useRouter();
    const supabase = createClient();

    useEffect(() => { setMounted(true); }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError('Credenciais inválidas. Acesso negado.');
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className={styles.page}>
            {/* Ambient orbs */}
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />

            {/* Terminal header */}
            <div className={styles.terminalHeader}>
                <span className={styles.cmdLine}>inventary-sec --version 2.0.1</span>
                <span className={styles.statusLine}>Secure IT Governance Platform</span>
                <span style={{ color: 'var(--accent)', opacity: 0.5, fontSize: 11 }}>
                    Waiting for authentication...
                </span>
            </div>

            {/* Login card */}
            <div className={`${styles.card} ${mounted ? styles.visible : ''}`}>
                <div className={styles.logo}>
                    <ShieldCheck size={26} color="var(--accent)" />
                </div>
                <h1 className={styles.title}>Inventary</h1>
                <p className={styles.subtitle}>Secure IT Governance System</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="email">user_email</label>
                        <div className={styles.inputWrap}>
                            <Mail size={15} className={styles.icon} />
                            <input
                                id="email"
                                type="email"
                                className={`input ${styles.input}`}
                                placeholder="usuario@empresa.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">user_password</label>
                        <div className={styles.inputWrap}>
                            <Lock size={15} className={styles.icon} />
                            <input
                                id="password"
                                type={showPass ? 'text' : 'password'}
                                className={`input ${styles.input} ${styles.inputPadded}`}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.eye}
                                onClick={() => setShowPass(!showPass)}
                                tabIndex={-1}
                                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary ${styles.submit}`}
                        disabled={loading}
                    >
                        {loading
                            ? <Loader2 size={16} className={styles.spin} />
                            : 'authenticate --system'
                        }
                    </button>
                </form>
            </div>

            {/* Footer status */}
            <div className={styles.terminalFooter}>
                <span>
                    <span className={styles.footerDot} />
                    FGREAT © {new Date().getFullYear()}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                    TLS 1.3 · AES-256 · OAuth2
                </span>
            </div>
        </div>
    );
}
