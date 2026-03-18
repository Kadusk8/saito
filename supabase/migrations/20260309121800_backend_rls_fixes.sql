-- Fix for existing data (Optional migration step to link all existing users to the first org, or orgs to the first user)
-- For a brand new setup, this is not strictly needed.

-- However, we must ensure that the webhook / evolution-api callbacks in the backend can STILL update groups and instances.
-- To do this cleanly without modifying RLS complexly, your backend MUST use the Service Role Key for background jobs,
-- OR we create a policy that allows the DB to be updated if the request comes from an authenticated role OR if it has a specific header (service role).
-- The Supabase Service Role key BYPASSES RLS completely, which is exactly how backend workers should operate.

-- Example: if we want to allow public inserts to audit_logs (not recommended, but an example):
-- CREATE POLICY "Allow backend to insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- No additional SQL needed here if backend uses Service Role key for webhooks/workers.
-- For the frontend API routes that the User calls (like /api/instances), those should pass the User's JWT to Supabase.

-- Let's ensure the users_organizations table is ready and the RLS is explicitly set for INSERT/UPDATE as well.

CREATE POLICY "Users can edit their own org mappings"
  ON public.users_organizations
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own org mappings"
  ON public.users_organizations
  FOR DELETE
  USING (user_id = auth.uid());

-- Allow organizations to be updated by their mapped users
CREATE POLICY "Users can update their own organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM public.users_organizations 
      WHERE user_id = auth.uid()
    )
  );
