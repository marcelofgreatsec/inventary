-- =============================================
-- MIGRATIONS V2 — Inventary feature expansion
-- Run this in your Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. LICENSES — add categoria column
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='licenses' AND column_name='categoria'
  ) THEN
    ALTER TABLE public.licenses ADD COLUMN categoria TEXT DEFAULT 'Other';
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. DOCUMENTS — add responsavel + data_revisao
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='documents' AND column_name='responsavel'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN responsavel TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='documents' AND column_name='data_revisao'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN data_revisao DATE;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. ASSETS — expand with new fields
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='brand') THEN
    ALTER TABLE public.assets ADD COLUMN brand TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='model') THEN
    ALTER TABLE public.assets ADD COLUMN model TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='patrimonio') THEN
    ALTER TABLE public.assets ADD COLUMN patrimonio TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='acquisition_date') THEN
    ALTER TABLE public.assets ADD COLUMN acquisition_date DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='acquisition_value') THEN
    ALTER TABLE public.assets ADD COLUMN acquisition_value NUMERIC(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='warranty_date') THEN
    ALTER TABLE public.assets ADD COLUMN warranty_date DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='responsible_user') THEN
    ALTER TABLE public.assets ADD COLUMN responsible_user TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='department') THEN
    ALTER TABLE public.assets ADD COLUMN department TEXT;
  END IF;
END $$;

-- Update assets type check constraint to include new types
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE public.assets ADD CONSTRAINT assets_type_check CHECK (
  type IN (
    'Notebook', 'Desktop', 'Monitor', 'Servidor', 'Switch',
    'Roteador', 'Telefone', 'Celular', 'Impressora', 'Storage', 'Outros',
    'Rede', 'Outro'  -- kept for backward compatibility
  )
);

-- ─────────────────────────────────────────────
-- 4. INFOSEC CONTACTS — new table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infosec_contacts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  cargo      TEXT,
  email      TEXT,
  telefone   TEXT,
  empresa    TEXT,
  categoria  TEXT NOT NULL DEFAULT 'Interno',
  notas      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.infosec_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage infosec_contacts" ON public.infosec_contacts;
CREATE POLICY "Authenticated users can manage infosec_contacts"
  ON public.infosec_contacts FOR ALL TO authenticated USING (true);

-- ─────────────────────────────────────────────
-- 5. ARCHIVED USERS — new table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.archived_users (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                    TEXT NOT NULL,
  email                   TEXT,
  departamento            TEXT,
  cargo                   TEXT,
  data_entrada            DATE,
  data_saida              DATE,
  motivo_saida            TEXT,
  equipamentos_devolvidos BOOLEAN DEFAULT FALSE,
  acessos_revogados       BOOLEAN DEFAULT FALSE,
  notas                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.archived_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage archived_users" ON public.archived_users;
CREATE POLICY "Authenticated users can manage archived_users"
  ON public.archived_users FOR ALL TO authenticated USING (true);

-- ─────────────────────────────────────────────
-- 6. SUPPLIERS — new table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome             TEXT NOT NULL,
  cnpj             TEXT,
  website          TEXT,
  email_principal  TEXT,
  telefone         TEXT,
  contato_nome     TEXT,
  contato_email    TEXT,
  contato_telefone TEXT,
  categoria        TEXT NOT NULL DEFAULT 'Software',
  status           TEXT NOT NULL DEFAULT 'Ativo',
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
  ON public.suppliers FOR ALL TO authenticated USING (true);
