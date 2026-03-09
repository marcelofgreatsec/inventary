'use client';

import useSWR from 'swr';
import { Settings, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Log {
    id: string; action: string; table_name: string; user_email?: string; ip_address?: string; created_at: string;
}

const ACTION_MAP: Record<string, string> = {
    'CREATE': 'badge-green', 'DELETE': 'badge-red', 'UPDATE': 'badge-amber'
};

function AdminPage() {
    const { data: logs = [], isLoading, mutate } = useSWR<Log[]>('/api/admin/logs', fetcher);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Administração</h1>
                    <p className="page-subtitle">Log de auditoria do sistema</p>
                </div>
                <button className="btn btn-ghost" onClick={() => mutate()}>
                    <RefreshCw size={15} /> Atualizar
                </button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : logs.length === 0 ? (
                    <div className="empty"><Settings size={40} /><p>Nenhum log registrado ainda.</p><p style={{ fontSize: 13, marginTop: 6, color: 'var(--text-muted)' }}>Ações de criação e remoção aparecerão aqui.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Ação</th><th>Tabela</th><th>Usuário</th><th>IP</th><th>Data / Hora</th></tr>
                            </thead>
                            <tbody>
                                {logs.map(l => (
                                    <tr key={l.id}>
                                        <td><span className={`badge ${ACTION_MAP[l.action] || 'badge-blue'}`}>{l.action}</span></td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.table_name}</td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{l.user_email || '—'}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{l.ip_address || '—'}</td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {new Date(l.created_at).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Page() {
    return <MainLayout><AdminPage /></MainLayout>;
}
