-- Zera o custo mensal de todas as licenças
UPDATE public.licenses SET monthly_cost = 0;

-- Verificar resultado:
-- SELECT name, monthly_cost FROM public.licenses ORDER BY name;
