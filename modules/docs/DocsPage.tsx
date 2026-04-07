import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, FileText, Loader2, X, Paperclip,
    Folder as FolderIcon, ChevronRight, Lock, Eye,
    Search, Filter, FolderPlus, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const CAT_MAP: Record<string, string> = {
    'Procedimento': 'badge-blue', 'Política': 'badge-purple',
    'Manual': 'badge-green', 'Relatório': 'badge-amber', 'Outro': 'badge-blue'
};

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    password?: string;
    created_at: string;
}

interface Doc {
    id: string; title: string; category: string; author_name?: string; created_at: string; content?: string;
    file_url?: string; file_name?: string; file_size?: number; folder_id?: string;
}

function FolderModal({ onClose, onSave, parentId }: { onClose: () => void; onSave: () => void; parentId: string | null }) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password: password || null, parent_id: parentId })
        });
        onSave(); onClose(); setSaving(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Pasta</h2>
                    <button onClick={onClose} className="btn-close"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome da Pasta *</label><input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Procedimentos RH" /></div>
                    <div className="form-group">
                        <label>Senha de Acesso (Opcional)</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" style={{ paddingLeft: 34 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe vazio para acesso livre" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} className="spin" /> : 'Criar Pasta'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PasswordPrompt({ folderName, onConfirm, onCancel }: { folderName: string; onConfirm: (pass: string) => void; onCancel: () => void }) {
    const [pass, setPass] = useState('');
    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 360, textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--amber-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Lock size={24} color="var(--amber)" />
                </div>
                <h2 className="modal-title">Acesso Restrito</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>A pasta <strong>{folderName}</strong> é protegida. Insira a senha para visualizar os documentos.</p>
                <input className="input" type="password" autoFocus value={pass} onChange={e => setPass(e.target.value)} placeholder="Digite a senha..." style={{ textAlign: 'center', marginBottom: 16 }} onKeyDown={e => e.key === 'Enter' && onConfirm(pass)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={onCancel}>Voltar</button>
                    <button className="btn btn-primary" onClick={() => onConfirm(pass)}>Desbloquear</button>
                </div>
            </div>
        </div>
    );
}

function RestrictedViewer({ doc, onClose }: { doc: Doc; onClose: () => void }) {
    // Prevent right click and copy
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    const isImage = doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPDF   = doc.file_url?.match(/\.pdf$/i);

    return (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)', zIndex: 9999 }}>
            <div style={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 10, zIndex: 10000 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ShieldAlert size={14} color="var(--red)" />
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>MODO DE VISUALIZAÇÃO RESTRITA - DOWNLOAD DESABILITADO</span>
                </div>
                <button onClick={onClose} className="btn btn-primary" style={{ height: 40, width: 40, padding: 0, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <X size={20} />
                </button>
            </div>
            
            <div className="viewer-container" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px 20px' }}>
                <div className="viewer-header" style={{ marginBottom: 20, textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', margin: 0 }}>{doc.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{doc.category} • {doc.file_name || 'Documento de Texto'}</p>
                </div>

                <div className="viewer-content" style={{ flex: 1, width: '100%', maxWidth: 1000, background: isPDF ? 'transparent' : '#fff', borderRadius: 8, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    {isPDF ? (
                        <iframe src={`${doc.file_url}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="100%" style={{ border: 'none' }} />
                    ) : isImage ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                            <img src={doc.file_url} alt={doc.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} onDragStart={e => e.preventDefault()} />
                        </div>
                    ) : (
                        <div style={{ padding: 40, color: '#333', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: '100%', overflowY: 'auto', background: '#f8fafc' }}>
                            {doc.content || 'Nenhum conteúdo disponível.'}
                        </div>
                    )}
                    {/* Overlay transparent layer to block interactions further */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
                </div>
            </div>

            <style jsx>{`
                .viewer-content :global(body) {
                    user-select: none !important;
                }
            `}</style>
        </div>
    );
}

function DocModal({ onClose, onSave, folderId, folders }: { onClose: () => void; onSave: () => void; folderId: string | null; folders: Folder[] }) {
    const [form, setForm] = useState({ title: '', category: 'Procedimento', content: '', folder_id: folderId || '' });
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);

        let fileData = {};
        if (file) {
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error } = await supabase.storage.from('documents').upload(`docs/${fileName}`, file);
            if (error) { alert('Erro: ' + error.message); setSaving(false); return; }

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(`docs/${fileName}`);
            fileData = { file_url: publicUrl, file_name: file.name, file_size: file.size };
        }

        await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, ...fileData })
        });
        onSave(); onClose(); setSaving(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 640 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Documentação</h2>
                    <button onClick={onClose} className="btn-close"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Título *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Título do doc" /></div>
                        <div className="form-group">
                            <label>Pasta Destino</label>
                            <select className="select" value={form.folder_id} onChange={e => setForm(p => ({ ...p, folder_id: e.target.value }))}>
                                <option value="">Raiz (Sem pasta)</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label>Categoria</label><select className="select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{['Procedimento', 'Política', 'Manual', 'Relatório', 'Outro'].map(c => <option key={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Conteúdo</label><textarea className="input" style={{ minHeight: 120 }} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Descrição ou conteúdo do doc..." /></div>

                    <div className="form-group">
                        <label>Arquivo</label>
                        <div onClick={() => fileInputRef.current?.click()} className="input-file-simulated">
                            <Paperclip size={16} /> {file ? file.name : 'Clique para anexar (PDF ou Imagem)'}
                        </div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} className="spin" /> : 'Salvar Documento'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DocsPage() {
    const [docModal,      setDocModal]      = useState(false);
    const [folderModal,   setFolderModal]   = useState(false);
    const [passPrompt,    setPassPrompt]    = useState<Folder | null>(null);
    const [viewerDoc,     setViewerDoc]     = useState<Doc | null>(null);
    const [search,        setSearch]        = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [unlocked,      setUnlocked]      = useState<Set<string>>(new Set());

    const { data: docs, refresh: refreshDocs } = useRealtimeTable<Doc>('/api/documents', 'documents');
    const { data: allFolders, refresh: refreshFolders } = useRealtimeTable<Folder>('/api/folders', 'folders');

    const folders = useMemo(() => allFolders.filter(f => f.parent_id === currentFolder), [allFolders, currentFolder]);
    const folderDocs = useMemo(() => docs.filter(d => (d.folder_id || null) === currentFolder), [docs, currentFolder]);
    
    const folderPath = useMemo(() => {
        const path: Folder[] = [];
        let currId = currentFolder;
        while (currId) {
            const f = allFolders.find(x => x.id === currId);
            if (!f) break;
            path.unshift(f);
            currId = f.parent_id;
        }
        return path;
    }, [allFolders, currentFolder]);

    const handleOpenFolder = (f: Folder) => {
        if (f.password && !unlocked.has(f.id)) {
            setPassPrompt(f);
        } else {
            setCurrentFolder(f.id);
        }
    };

    const handleUnlock = (pass: string) => {
        if (passPrompt && passPrompt.password === pass) {
            setUnlocked(new Set([...unlocked, passPrompt.id]));
            setCurrentFolder(passPrompt.id);
            setPassPrompt(null);
        } else {
            alert('Senha incorreta.');
        }
    };

    const handleDeleteDoc = async (id: string) => {
        if (!confirm('Remover documento?')) return;
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        refreshDocs();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {docModal && <DocModal onClose={() => setDocModal(false)} onSave={refreshDocs} folderId={currentFolder} folders={allFolders} />}
            {folderModal && <FolderModal onClose={() => setFolderModal(false)} onSave={refreshFolders} parentId={currentFolder} />}
            {passPrompt && <PasswordPrompt folderName={passPrompt.name} onConfirm={handleUnlock} onCancel={() => setPassPrompt(null)} />}
            {viewerDoc && <RestrictedViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

            {/* Header / Breadcrumbs */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">Documentações</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                        <div 
                            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', hover: { color: 'var(--accent)' } as any }} 
                            onClick={() => setCurrentFolder(null)}
                        >
                            <FileText size={14} /> <span>Raiz</span>
                        </div>
                        {folderPath.map(p => (
                            <React.Fragment key={p.id}>
                                <ChevronRight size={12} />
                                <span onClick={() => setCurrentFolder(p.id)} style={{ cursor: 'pointer' }}>{p.name}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="input" placeholder="Buscar docs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, width: 200 }} />
                    </div>
                    <button className="btn btn-ghost" onClick={() => setFolderModal(true)}><FolderPlus size={16} /> Nova Pasta</button>
                    <button className="btn btn-primary" onClick={() => setDocModal(true)}><Plus size={16} /> Novo Doc</button>
                </div>
            </div>

            {/* Grid for Folders and Files */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {/* Folders First */}
                {folders.map(f => (
                    <div key={f.id} className="card folder-card" onClick={() => handleOpenFolder(f)} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
                            <FolderIcon size={20} fill="currentColor" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {f.name}
                                {f.password && <Lock size={12} color="var(--amber)" />}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{allFolders.filter(x => x.parent_id === f.id).length} pastas • {docs.filter(d => d.folder_id === f.id).length} arquivos</div>
                        </div>
                        <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                ))}

                {/* Documents */}
                {folderDocs.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).map(d => (
                    <div key={d.id} className="card doc-card" style={{ padding: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                    <FileText size={16} />
                                </div>
                                <div style={{ maxWidth: 160 }}>
                                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <span className={`badge ${CAT_MAP[d.category] || 'badge-blue'}`} style={{ fontSize: 9 }}>{d.category}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', minHeight: 20 }}>
                            {d.file_name && <Paperclip size={10} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name || 'Apenas texto'}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: 8, marginTop: 4 }}>
                            <button className="btn btn-primary" onClick={() => setViewerDoc(d)} style={{ gap: 8, fontSize: 12, height: 36 }}>
                                <Eye size={14} /> Visualizar
                            </button>
                            <button className="btn btn-ghost" onClick={() => handleDeleteDoc(d.id)} style={{ padding: 0, height: 36, color: 'var(--red)' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {folders.length === 0 && folderDocs.length === 0 && (
                <div className="card empty" style={{ padding: 60 }}>
                    <FolderIcon size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 16 }}>{currentFolder ? 'Esta pasta está vazia.' : 'Nenhuma documentação na raiz.'}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setFolderModal(true)}>Criar Pasta</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setDocModal(true)}>Enviar Doc</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .folder-card:hover { border-color: var(--amber) !important; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
                .doc-card:hover { border-color: var(--accent) !important; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
                .input-file-simulated {
                    border: 1px dashed var(--border-mid);
                    border-radius: var(--radius);
                    padding: 12px;
                    text-align: center;
                    cursor: pointer;
                    background: var(--bg-overlay);
                    font-size: 13,
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8;
                    color: var(--text-secondary);
                }
                .btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
                .btn-close:hover { background: var(--bg-elevated); color: var(--text-primary); }
            `}</style>
        </div>
    );
}
