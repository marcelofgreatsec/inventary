-- =============================================
-- SUPABASE SCHEMA UPDATE: FOLDERS & PROTECTED DOCS
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  password TEXT, -- Plain text password for demo, or ideally hashed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);

-- 2. Add folder_id to documents
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='folder_id') THEN
    ALTER TABLE public.documents ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. RLS for folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage folders" ON public.folders;
CREATE POLICY "Authenticated users can manage folders" ON public.folders 
  FOR ALL TO authenticated USING (true);

-- 4. Ensure Audit Log support (already exists but nice to have for folders too)
-- No changes needed to audit_logs table itself.
