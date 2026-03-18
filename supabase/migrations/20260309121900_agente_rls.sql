-- Enable RLS on core tables
ALTER TABLE public.contatos_agente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can manage their own contatos" ON public.contatos_agente;
DROP POLICY IF EXISTS "Users can manage their own follow_ups" ON public.follow_up;

-- IMPORTANT: These policies assume the user has their 'organization_id' in their JWT.
-- If not using custom JWT claims, fallback to a JOIN on users_organizations or check the role.

CREATE POLICY "Users can manage their own contatos" ON public.contatos_agente
FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their own follow_ups" ON public.follow_up
FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
);

-- Note: Backend workers using SERVICE_ROLE_KEY bypass these policies.
