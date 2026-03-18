-- Enable RLS for all major tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_groups ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policy
-- Users can only SELECT and UPDATE their own organization.
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM public.users_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Since users_organizations doesn't exist yet, we'll create a mapping table to link auth.users to organizations.
CREATE TABLE IF NOT EXISTS public.users_organizations (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);
ALTER TABLE public.users_organizations ENABLE ROW LEVEL SECURITY;

-- Policy for users_organizations: a user can see their own mappings
CREATE POLICY "Users can view their own org mappings"
  ON public.users_organizations
  FOR SELECT
  USING (user_id = auth.uid());

-- Function & Trigger to automatically create an Organization when a new User signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- 1. Create a new organization for the user
  INSERT INTO public.organizations (name, plan_id)
  VALUES (NEW.email || '''s Organization', 'free') -- Default plan or name logic
  RETURNING id INTO new_org_id;

  -- 2. Link the user to this organization
  INSERT INTO public.users_organizations (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Instances Policy
-- Instances belong to an organization. A user can CRUD instances if they are in that organization.
CREATE POLICY "Users can manage instances in their org"
  ON public.instances
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

-- 3. Groups Policy
-- Groups belong to an Instance. The Instance belongs to an Organization.
CREATE POLICY "Users can manage groups via instances in their org"
  ON public.groups
  FOR ALL
  USING (
    instance_id IN (
      SELECT id FROM public.instances WHERE organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- 4. Members Policy
-- Members belong to a Group.
CREATE POLICY "Users can manage members via groups in their org"
  ON public.members
  FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE instance_id IN (
        SELECT id FROM public.instances WHERE organization_id IN (
          SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 5. Audit Logs Policy
-- Audit logs belong to a Group.
CREATE POLICY "Users can view audit logs via groups in their org"
  ON public.audit_logs
  FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE instance_id IN (
        SELECT id FROM public.instances WHERE organization_id IN (
          SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 6. Launch Campaigns Policy
-- Campaigns belong to an Organization.
CREATE POLICY "Users can manage campaigns in their org"
  ON public.launch_campaigns
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
    )
  );

-- 7. Launch Groups Policy
-- Launch Groups belong to Launch Campaigns.
CREATE POLICY "Users can manage launch groups via campaigns in their org"
  ON public.launch_groups
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.launch_campaigns WHERE organization_id IN (
        SELECT organization_id FROM public.users_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- IMPORTANT FIX FOR BACKEND WEBHOOKS / WORKERS:
-- Since workers and webhooks operate via the supabase-js client using the ANON key, 
-- they will be BLOCKED by RLS unless they use the SERVICE ROLE key.
-- Alternatively, we can allow updates to instances/groups coming from the webhook 
-- if we create specific policies, but the standard secure pattern is that backend 
-- worker scripts should use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.
