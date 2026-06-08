-- =============================================
-- FIX: Atualizar categorias das licenças
-- Tabela: public.licenses | Campo nome: name
-- Run no Supabase SQL Editor
-- =============================================

UPDATE public.licenses SET categoria = 'Design'
  WHERE name IN ('Getty Image', 'Envato', 'Freepik', 'Adobe');

UPDATE public.licenses SET categoria = 'AI'
  WHERE name IN ('Topaz Lab', 'Chat GPT', 'Higgsfiel', 'Visual Electric', 'Kling.AI - Sigapore');

UPDATE public.licenses SET categoria = 'Office'
  WHERE name IN ('Intouch', 'Dropbox', 'Microsoft 365 Copilot', 'Microsoft 365 Bussines Premium', 'Microsoft 365 Bussines Basic');

UPDATE public.licenses SET categoria = 'Video'
  WHERE name = 'Maxon';

UPDATE public.licenses SET categoria = 'Presentations'
  WHERE name IN ('Pitch Deck', 'Frame Io');

-- Soho Voices e User Centrix mantêm 'Other' (já é o default)
-- Verificar resultado:
-- SELECT name, categoria FROM public.licenses ORDER BY categoria, name;
