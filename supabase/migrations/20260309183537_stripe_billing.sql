-- Create stripe_customers table
CREATE TABLE public.stripe_customers (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid', 'trialing'
    price_id TEXT NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies so that logged in users can only view their organization's billing info
CREATE POLICY "Users can read their own stripe customer"
ON public.stripe_customers
FOR SELECT
USING ( organization_id = auth.jwt() ->> 'organization_id' );

-- NOTE: we don't grant INSERT/UPDATE/DELETE. That will be exclusively done by the backend server using the Service Role Key

CREATE POLICY "Users can read their own subscriptions"
ON public.subscriptions
FOR SELECT
USING ( organization_id = auth.jwt() ->> 'organization_id' );
