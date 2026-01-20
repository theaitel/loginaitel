
-- Grant permissions for pricing_packages table
GRANT SELECT ON public.pricing_packages TO authenticated;
GRANT SELECT ON public.pricing_packages TO anon;

-- Also ensure permissions for other related tables that might be accessed by clients
GRANT SELECT ON public.client_subscriptions TO authenticated;
GRANT SELECT ON public.subscription_history TO authenticated;
