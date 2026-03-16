-- =============================================
-- IT Inventory & Compliance System - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ASSETS
-- =============================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Servidor', 'Desktop', 'Notebook', 'Rede', 'Storage', 'Impressora', 'Outro')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Manutenção', 'Desativado')),
  ip TEXT,
  location TEXT,
  serial TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage assets" ON public.assets FOR ALL TO authenticated USING (true);

-- =============================================
-- BACKUPS
-- =============================================
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  server TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Sucesso' CHECK (status IN ('Sucesso', 'Falha', 'Rodando', 'Pendente')),
  type TEXT NOT NULL DEFAULT 'Completo' CHECK (type IN ('Completo', 'Incremental', 'Diferencial')),
  size_gb NUMERIC(10,2),
  duration_min INTEGER,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage backups" ON public.backups FOR ALL TO authenticated USING (true);

-- =============================================
-- LICENSES
-- =============================================
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Anual' CHECK (type IN ('Mensal', 'Anual', 'Perpétua')),
  status TEXT NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Expirada', 'A vencer')),
  seats INTEGER DEFAULT 1,
  monthly_cost NUMERIC(10,2) DEFAULT 0,
  renewal_date DATE,
  key TEXT,
  login TEXT,
  password TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage licenses" ON public.licenses FOR ALL TO authenticated USING (true);

-- =============================================
-- DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'Procedimento' CHECK (category IN ('Procedimento', 'Política', 'Manual', 'Relatório', 'Outro')),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage documents" ON public.documents FOR ALL TO authenticated USING (true);

-- =============================================
-- INFRASTRUCTURE
-- =============================================
CREATE TABLE IF NOT EXISTS public.infrastructure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Servidor', 'Switch', 'Firewall', 'Router', 'Storage', 'VM', 'Outro')),
  status TEXT NOT NULL DEFAULT 'Online' CHECK (status IN ('Online', 'Offline', 'Manutenção')),
  ip TEXT,
  os TEXT,
  cpu TEXT,
  ram_gb INTEGER,
  disk_gb INTEGER,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.infrastructure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage infrastructure" ON public.infrastructure FOR ALL TO authenticated USING (true);

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- SAMPLE DATA (optional, for testing)
-- =============================================
INSERT INTO public.assets (name, type, status, ip, location) VALUES
  ('SRV-PRINCIPAL-01', 'Servidor', 'Ativo', '192.168.1.10', 'Datacenter A'),
  ('WS-FINANCEIRO-01', 'Desktop', 'Ativo', '192.168.1.50', 'Financeiro'),
  ('SW-CORE-01', 'Rede', 'Ativo', '192.168.1.1', 'Datacenter A'),
  ('NB-DIRETOR-01', 'Notebook', 'Ativo', '192.168.1.80', 'Diretoria'),
  ('SRV-BACKUP-01', 'Storage', 'Manutenção', '192.168.1.15', 'Datacenter B')
ON CONFLICT DO NOTHING;

INSERT INTO public.backups (name, server, status, type, size_gb, last_run, next_run) VALUES
  ('Backup Diário BD', 'SRV-DB-01', 'Sucesso', 'Completo', 45.2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '23 hours'),
  ('Backup Semanal Files', 'SRV-FS-01', 'Sucesso', 'Incremental', 120.5, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days'),
  ('Backup Mensal Sistema', 'SRV-PRINCIPAL-01', 'Falha', 'Completo', 0, NOW() - INTERVAL '1 week', NOW() + INTERVAL '3 weeks')
ON CONFLICT DO NOTHING;

INSERT INTO public.licenses (name, vendor, type, status, seats, monthly_cost, renewal_date) VALUES
  ('Microsoft 365 Business', 'Microsoft', 'Mensal', 'Ativa', 25, 3500.00, NOW() + INTERVAL '30 days'),
  ('Adobe Creative Cloud', 'Adobe', 'Anual', 'Ativa', 5, 450.00, NOW() + INTERVAL '8 months'),
  ('Kaspersky Endpoint', 'Kaspersky', 'Anual', 'A vencer', 50, 800.00, NOW() + INTERVAL '15 days')
ON CONFLICT DO NOTHING;
