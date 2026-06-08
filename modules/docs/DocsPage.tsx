'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, FileText, Loader2, X, Paperclip,
    Folder as FolderIcon, ChevronRight, Lock, Eye,
    Search, FolderPlus, ShieldAlert, User, Calendar,
    GripVertical, Upload,
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
    responsavel?: string; data_revisao?: string;
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
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
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
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Criar Pasta'}</button>
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

            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px 20px' }}>
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', margin: 0 }}>{doc.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{doc.category} • {doc.file_name || 'Documento de Texto'}</p>
                    {doc.responsavel && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                            Responsável: {doc.responsavel}
                            {doc.data_revisao && ` · Revisão: ${new Date(doc.data_revisao + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                        </p>
                    )}
                </div>

                <div style={{ flex: 1, width: '100%', maxWidth: 1000, background: isPDF ? 'transparent' : '#fff', borderRadius: 8, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
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
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
                </div>
            </div>
        </div>
    );
}

function DocModal({ onClose, onSave, folderId, folders }: { onClose: () => void; onSave: () => void; folderId: string | null; folders: Folder[] }) {
    const [form, setForm] = useState({
        title: '', category: 'Procedimento', content: '',
        folder_id: folderId || '', responsavel: '', data_revisao: ''
    });
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
            body: JSON.stringify({ ...form, ...fileData, data_revisao: form.data_revisao || null })
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 640 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Documentação</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Título *</label>
                            <input className="input" value={form.title} onChange={f('title')} required placeholder="Título do documento" />
                        </div>
                        <div className="form-group">
                            <label>Pasta Destino</label>
                            <select className="select" value={form.folder_id} onChange={f('folder_id')}>
                                <option value="">Raiz (Sem pasta)</option>
                                {folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="select" value={form.category} onChange={f('category')}>
                                {['Procedimento', 'Política', 'Manual', 'Relatório', 'Outro'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Responsável</label>
                            <input className="input" value={form.responsavel} onChange={f('responsavel')} placeholder="Nome do responsável" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data de Revisão</label>
                        <input className="input" type="date" value={form.data_revisao} onChange={f('data_revisao')} />
                    </div>
                    <div className="form-group">
                        <label>Conteúdo</label>
                        <textarea className="input" style={{ minHeight: 100 }} value={form.content} onChange={f('content')} placeholder="Descrição ou conteúdo do documento..." />
                    </div>

                    <div className="form-group">
                        <label>Arquivo</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '1px dashed var(--border-mid)', borderRadius: 'var(--radius)',
                                padding: '12px 16px', cursor: 'pointer', background: 'var(--bg-overlay)',
                                display: 'flex', alignItems: 'center', gap: 10,
                                color: file ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 13,
                                transition: 'border-color 0.2s',
                            }}
                        >
                            <Paperclip size={16} />
                            {file ? file.name : 'Clique para anexar (PDF ou Imagem)'}
                        </div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar Documento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BulkUploadModal({ onClose, onSave, folderId }: { onClose: () => void; onSave: () => void; folderId: string | null }) {
    const [files, setFiles] = useState<File[]>([]);
    const [category, setCategory] = useState('Outro');
    const [responsavel, setResponsavel] = useState('');
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState<{ name: string; status: 'pending' | 'uploading' | 'success' | 'error'; errorMsg?: string }[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selectedFiles]);
            setProgress(prev => [
                ...prev,
                ...selectedFiles.map(f => ({ name: f.name, status: 'pending' }))
            ]);
        }
    };

    const traverseEntry = (entry: any): Promise<File[]> => {
        return new Promise((resolve) => {
            if (entry.isFile) {
                entry.file((file: File) => {
                    resolve([file]);
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                const allFiles: File[] = [];
                const readEntries = () => {
                    dirReader.readEntries(async (entries: any[]) => {
                        if (entries.length === 0) {
                            resolve(allFiles);
                        } else {
                            const filePromises = entries.map(e => traverseEntry(e));
                            const filesArrays = await Promise.all(filePromises);
                            allFiles.push(...filesArrays.flat());
                            readEntries();
                        }
                    }, () => resolve([]));
                };
                readEntries();
            } else {
                resolve([]);
            }
        });
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.items) {
            const filePromises: Promise<File[]>[] = [];
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                    const entry = item.webkitGetAsEntry();
                    if (entry) {
                        filePromises.push(traverseEntry(entry));
                    }
                }
            }
            const filesArrays = await Promise.all(filePromises);
            const allFiles = filesArrays.flat();
            if (allFiles.length > 0) {
                setFiles(prev => [...prev, ...allFiles]);
                setProgress(prev => [
                    ...prev,
                    ...allFiles.map(f => ({ name: f.name, status: 'pending' }))
                ]);
            }
        } else if (e.dataTransfer.files) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...droppedFiles]);
            setProgress(prev => [
                ...prev,
                ...droppedFiles.map(f => ({ name: f.name, status: 'pending' }))
            ]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;
        setSaving(true);

        // Map initial progress
        const currentProgress = files.map(f => ({ name: f.name, status: 'pending' as const, errorMsg: undefined }));
        setProgress(currentProgress);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            currentProgress[i].status = 'uploading';
            setProgress([...currentProgress]);

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('documents').upload(`docs/${fileName}`, file);
                
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(`docs/${fileName}`);

                // Strip extension for the title
                const title = file.name.replace(/\.[^/.]+$/, "");
                const res = await fetch('/api/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        category,
                        content: '',
                        folder_id: folderId || null,
                        responsavel: responsavel || null,
                        data_revisao: null,
                        file_url: publicUrl,
                        file_name: file.name,
                        file_size: file.size
                    })
                });

                if (!res.ok) {
                    const errorJson = await res.json().catch(() => ({}));
                    throw new Error(errorJson.error || 'Falha ao salvar no banco de dados');
                }

                currentProgress[i].status = 'success';
            } catch (err: any) {
                console.error(err);
                currentProgress[i].status = 'error';
                currentProgress[i].errorMsg = err.message || 'Erro inesperado';
            }
            setProgress([...currentProgress]);
        }

        onSave();
        setSaving(false);
        const hasErrors = currentProgress.some(p => p.status === 'error');
        if (!hasErrors) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Upload em Lote</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div className="form-group">
                            <label>Categoria Padrão</label>
                            <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                                {['Procedimento', 'Política', 'Manual', 'Relatório', 'Outro'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Responsável Padrão</label>
                            <input className="input" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome (opcional)" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>Selecionar Conteúdo</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => !saving && fileInputRef.current?.click()}
                                disabled={saving}
                                style={{ gap: 8, fontSize: 12, height: 36 }}
                            >
                                <Paperclip size={14} /> Arquivos
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => !saving && folderInputRef.current?.click()}
                                disabled={saving}
                                style={{ gap: 8, fontSize: 12, height: 36 }}
                            >
                                <FolderIcon size={14} /> Pasta Inteira
                            </button>
                        </div>
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            style={{
                                border: dragActive ? '2px dashed var(--accent)' : '1px dashed var(--border-mid)',
                                borderRadius: 'var(--radius)',
                                padding: '24px 16px',
                                background: dragActive ? 'rgba(0,212,170,0.06)' : 'var(--bg-overlay)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                color: files.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: 13,
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                minHeight: 120,
                                cursor: 'pointer'
                            }}
                            onClick={() => !saving && fileInputRef.current?.click()}
                        >
                            <Upload size={24} color="var(--accent)" />
                            {files.length > 0 ? (
                                <span><strong>{files.length} arquivos</strong> selecionados</span>
                            ) : (
                                <span>Arraste arquivos/pastas ou <strong>clique para navegar</strong></span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={handleFileChange} disabled={saving} />
                        <input 
                            type="file" 
                            ref={folderInputRef} 
                            webkitdirectory="true"
                            // @ts-ignore
                            directory="true"
                            multiple 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange} 
                            disabled={saving} 
                        />
                    </div>

                    {files.length > 0 && (
                        <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 20, border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', background: 'var(--bg-elevated)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Fila de Envio ({files.length}):</span>
                                <button type="button" className="btn btn-ghost" onClick={() => { setFiles([]); setProgress([]); }} disabled={saving} style={{ height: 20, padding: '0 6px', fontSize: 10, color: 'var(--red)' }}>Limpar Tudo</button>
                            </div>
                            {progress.map((p, idx) => (
                                <div key={idx} style={{ padding: '6px 0', borderBottom: idx < progress.length - 1 ? '1px solid var(--border-mid)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%', color: 'var(--text-primary)' }}>{p.name}</span>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: p.status === 'success' ? 'var(--green)' : p.status === 'error' ? 'var(--red)' : p.status === 'uploading' ? 'var(--accent)' : 'var(--text-muted)'
                                        }}>
                                            {p.status === 'success' && 'Concluído'}
                                            {p.status === 'error' && 'Erro'}
                                            {p.status === 'uploading' && 'Enviando...'}
                                            {p.status === 'pending' && 'Pendente'}
                                        </span>
                                    </div>
                                    {p.status === 'error' && p.errorMsg && (
                                        <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2, paddingLeft: 6, borderLeft: '2px solid var(--red)' }}>
                                            {p.errorMsg}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || files.length === 0}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : `Subir ${files.length} Itens`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DocsPage() {
    const [docModal,      setDocModal]      = useState(false);
    const [folderModal,   setFolderModal]   = useState(false);
    const [bulkModal,     setBulkModal]     = useState(false);
    const [passPrompt,    setPassPrompt]    = useState<Folder | null>(null);
    const [viewerDoc,     setViewerDoc]     = useState<Doc | null>(null);
    const [search,        setSearch]        = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [unlocked,      setUnlocked]      = useState<Set<string>>(new Set());

    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setSelectedDocIds(new Set());
    }, [currentFolder]);

    // drag state
    const [draggingDocId,   setDraggingDocId]   = useState<string | null>(null);
    const [dragOverTarget,  setDragOverTarget]   = useState<string | null>(null); // folder id or '__root__'

    const { data: docs,       refresh: refreshDocs    } = useRealtimeTable<Doc>('/api/documents', 'documents');
    const { data: allFolders, refresh: refreshFolders } = useRealtimeTable<Folder>('/api/folders', 'folders');

    const folders    = useMemo(() => allFolders.filter(f => f.parent_id === currentFolder), [allFolders, currentFolder]);
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

    const parentFolderId = folderPath.length > 1 ? folderPath[folderPath.length - 2].id : null;

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

    const handleDeleteFolder = async (e: React.MouseEvent, folder: Folder) => {
        e.stopPropagation();
        if (!confirm(`Deseja realmente excluir a pasta "${folder.name}"? Os documentos contidos nela voltarão para a Raiz.`)) return;
        await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
        refreshFolders();
        refreshDocs();
    };

    const toggleSelectDoc = (id: string) => {
        setSelectedDocIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const isAllSelected = filteredDocs.length > 0 && filteredDocs.every(d => selectedDocIds.has(d.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedDocIds(prev => {
                const next = new Set(prev);
                filteredDocs.forEach(d => next.delete(d.id));
                return next;
            });
        } else {
            setSelectedDocIds(prev => {
                const next = new Set(prev);
                filteredDocs.forEach(d => next.add(d.id));
                return next;
            });
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedDocIds.size === 0) return;
        if (!confirm(`Deseja realmente excluir os ${selectedDocIds.size} documentos selecionados?`)) return;
        
        await Promise.all(
            Array.from(selectedDocIds).map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' }))
        );
        setSelectedDocIds(new Set());
        refreshDocs();
    };

    const filteredDocs = useMemo(() =>
        folderDocs.filter(d => d.title.toLowerCase().includes(search.toLowerCase())),
        [folderDocs, search]
    );

    // ── Drag-and-drop ─────────────────────────────────────
    const moveDoc = useCallback(async (docId: string, targetFolderId: string | null) => {
        await fetch(`/api/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_id: targetFolderId }),
        });
        refreshDocs();
    }, [refreshDocs]);

    const onDocDragStart = (e: React.DragEvent, docId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('docId', docId);
        setDraggingDocId(docId);
    };

    const onDocDragEnd = () => {
        setDraggingDocId(null);
        setDragOverTarget(null);
    };

    const onDropZoneDragOver = (e: React.DragEvent, targetId: string) => {
        if (!draggingDocId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(targetId);
    };

    const onDropZoneDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTarget(null);
        }
    };

    const onDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        const docId = e.dataTransfer.getData('docId') || draggingDocId;
        setDragOverTarget(null);
        setDraggingDocId(null);
        if (!docId) return;
        const doc = docs.find(d => d.id === docId);
        const currentDocFolder = doc?.folder_id ?? null;
        if (currentDocFolder === targetFolderId) return; // already there
        await moveDoc(docId, targetFolderId);
    };

    const isDragOver = (id: string) => dragOverTarget === id;
    const isAnyDragging = draggingDocId !== null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {docModal    && <DocModal    onClose={() => setDocModal(false)}    onSave={refreshDocs}    folderId={currentFolder} folders={allFolders} />}
            {folderModal && <FolderModal onClose={() => setFolderModal(false)} onSave={refreshFolders} parentId={currentFolder} />}
            {bulkModal   && <BulkUploadModal onClose={() => setBulkModal(false)} onSave={() => { refreshDocs(); refreshFolders(); }} folderId={currentFolder} />}
            {passPrompt  && <PasswordPrompt folderName={passPrompt.name} onConfirm={handleUnlock} onCancel={() => setPassPrompt(null)} />}
            {viewerDoc   && <RestrictedViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}

            {/* Header / Breadcrumbs */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">Documentações</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                        {/* Raiz como drop zone */}
                        <span
                            onClick={() => setCurrentFolder(null)}
                            onDragOver={e => onDropZoneDragOver(e, '__root__')}
                            onDragLeave={onDropZoneDragLeave}
                            onDrop={e => onDrop(e, null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                                color: currentFolder ? (isDragOver('__root__') ? 'var(--accent)' : 'var(--text-muted)') : 'var(--accent)',
                                padding: '2px 6px', borderRadius: 6,
                                background: isDragOver('__root__') ? 'rgba(0,212,170,0.12)' : 'transparent',
                                border: isDragOver('__root__') ? '1px dashed var(--accent)' : '1px solid transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            <FileText size={14} /> Raiz
                        </span>
                        {folderPath.map((p, i) => (
                            <React.Fragment key={p.id}>
                                <ChevronRight size={12} />
                                <span
                                    onClick={() => setCurrentFolder(p.id)}
                                    onDragOver={e => onDropZoneDragOver(e, `bc_${p.id}`)}
                                    onDragLeave={onDropZoneDragLeave}
                                    onDrop={e => onDrop(e, p.id)}
                                    style={{
                                        cursor: 'pointer',
                                        color: currentFolder === p.id ? 'var(--accent)' : (isDragOver(`bc_${p.id}`) ? 'var(--accent)' : 'var(--text-muted)'),
                                        padding: '2px 6px', borderRadius: 6,
                                        background: isDragOver(`bc_${p.id}`) ? 'rgba(0,212,170,0.12)' : 'transparent',
                                        border: isDragOver(`bc_${p.id}`) ? '1px dashed var(--accent)' : '1px solid transparent',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {p.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {isAnyDragging && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, border: '1px solid var(--border-mid)' }}>
                            <GripVertical size={13} /> Arraste para uma pasta
                        </div>
                    )}
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="input" placeholder="Buscar docs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, width: 200 }} />
                    </div>
                    <button className="btn btn-ghost" onClick={() => setFolderModal(true)}><FolderPlus size={16} /> Nova Pasta</button>
                    <button className="btn btn-ghost" onClick={() => setBulkModal(true)}><Upload size={16} /> Upload Lote</button>
                    <button className="btn btn-primary" onClick={() => setDocModal(true)}><Plus size={16} /> Novo Doc</button>
                </div>
            </div>

            {/* Bulk Selection Actions */}
            {filteredDocs.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    marginBottom: 16,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none', color: 'var(--text-secondary)' }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            style={{ cursor: 'pointer', width: 14, height: 14, accentColor: 'var(--accent)' }}
                        />
                        Selecionar todos os documentos nesta pasta ({filteredDocs.length})
                    </label>

                    {selectedDocIds.size > 0 && (
                        <button
                            className="btn"
                            onClick={handleDeleteSelected}
                            style={{
                                background: 'rgba(244, 63, 94, 0.15)',
                                color: 'var(--red)',
                                border: '1px solid rgba(244, 63, 94, 0.25)',
                                height: 34,
                                padding: '0 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'; }}
                        >
                            <Trash2 size={13} />
                            Excluir Selecionados ({selectedDocIds.size})
                        </button>
                    )}
                </div>
            )}

            {/* Grid for Folders and Files */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {/* Back navigation — também é drop zone para pasta pai */}
                {currentFolder && (
                    <div
                        className="card"
                        onClick={() => setCurrentFolder(parentFolderId)}
                        onDragOver={e => onDropZoneDragOver(e, `__parent__`)}
                        onDragLeave={onDropZoneDragLeave}
                        onDrop={e => onDrop(e, parentFolderId)}
                        style={{
                            padding: '20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                            border: isDragOver('__parent__') ? '1px dashed var(--accent)' : '1px dashed var(--border-mid)',
                            background: isDragOver('__parent__') ? 'rgba(0,212,170,0.06)' : undefined,
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDragOver('__parent__') ? 'var(--accent)' : 'var(--text-muted)' }}>
                            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                        <span style={{ fontSize: 13, color: isDragOver('__parent__') ? 'var(--accent)' : 'var(--text-secondary)' }}>
                            {isDragOver('__parent__') ? 'Mover para pasta acima' : 'Voltar'}
                        </span>
                    </div>
                )}

                {/* Folders — drop zones */}
                {folders.map(f => (
                    <div
                        key={f.id}
                        className="card"
                        onClick={() => !draggingDocId && handleOpenFolder(f)}
                        onDragOver={e => onDropZoneDragOver(e, f.id)}
                        onDragLeave={onDropZoneDragLeave}
                        onDrop={e => onDrop(e, f.id)}
                        style={{
                            padding: '20px', display: 'flex', alignItems: 'center', gap: 16, cursor: draggingDocId ? 'copy' : 'pointer',
                            border: isDragOver(f.id)
                                ? '1px dashed var(--amber)'
                                : '1px solid var(--border)',
                            background: isDragOver(f.id) ? 'rgba(245,158,11,0.06)' : undefined,
                            transform: isDragOver(f.id) ? 'scale(1.02)' : undefined,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!draggingDocId) e.currentTarget.style.borderColor = 'var(--amber)'; }}
                        onMouseLeave={e => { if (!draggingDocId) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: isDragOver(f.id) ? 'rgba(245,158,11,0.12)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', transition: 'background 0.15s' }}>
                            <FolderIcon size={20} fill="currentColor" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {f.name}
                                {f.password && <Lock size={12} color="var(--amber)" />}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {isDragOver(f.id)
                                    ? <span style={{ color: 'var(--amber)' }}>Soltar para mover aqui</span>
                                    : <>{allFolders.filter(x => x.parent_id === f.id).length} pastas · {docs.filter(d => d.folder_id === f.id).length} arquivos</>
                                }
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                onClick={(e) => handleDeleteFolder(e, f)}
                                className="btn btn-ghost"
                                style={{
                                    padding: 0,
                                    width: 28,
                                    height: 28,
                                    color: 'var(--red)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 6,
                                }}
                                title="Excluir Pasta"
                            >
                                <Trash2 size={13} />
                            </button>
                            <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                    </div>
                ))}

                {/* Documents — draggable */}
                {filteredDocs.map(d => (
                    <div
                        key={d.id}
                        className="card"
                        draggable
                        onDragStart={e => onDocDragStart(e, d.id)}
                        onDragEnd={onDocDragEnd}
                        style={{
                            padding: '20px', border: '1px solid var(--border)',
                            display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'all 0.2s',
                            opacity: draggingDocId === d.id ? 0.4 : 1,
                            cursor: 'grab',
                        }}
                        onMouseEnter={e => { if (draggingDocId !== d.id) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'start', width: '100%' }}>
                            <input
                                type="checkbox"
                                checked={selectedDocIds.has(d.id)}
                                onChange={() => toggleSelectDoc(d.id)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    cursor: 'pointer',
                                    width: 15,
                                    height: 15,
                                    marginTop: 10,
                                    accentColor: 'var(--accent)',
                                    flexShrink: 0
                                }}
                            />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0, position: 'relative' }}>
                                            <FileText size={16} />
                                            <GripVertical size={10} style={{ position: 'absolute', top: -6, right: -6, color: 'var(--text-muted)', opacity: 0.6 }} />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.title}>{d.title}</div>
                                            {d.responsavel && (
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <User size={10} /> {d.responsavel}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {d.data_revisao
                                                    ? <><Calendar size={9} /> Revisão: {new Date(d.data_revisao + 'T00:00:00').toLocaleDateString('pt-BR')}</>
                                                    : new Date(d.created_at).toLocaleDateString('pt-BR')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`badge ${CAT_MAP[d.category] || 'badge-blue'}`} style={{ fontSize: 9, flexShrink: 0 }}>{d.category}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', minHeight: 20 }}>
                                    {d.file_name && <Paperclip size={10} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.file_name}>{d.file_name || 'Apenas texto'}</span>
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
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {folders.length === 0 && filteredDocs.length === 0 && (
                <div className="card empty" style={{ padding: 60, marginTop: 16 }}>
                    <FolderIcon size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 16 }}>{currentFolder ? 'Esta pasta está vazia.' : 'Nenhuma documentação na raiz.'}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="btn btn-ghost" onClick={() => setFolderModal(true)}>Criar Pasta</button>
                        <button className="btn btn-primary" onClick={() => setDocModal(true)}>Enviar Doc</button>
                    </div>
                </div>
            )}
        </div>
    );
}
