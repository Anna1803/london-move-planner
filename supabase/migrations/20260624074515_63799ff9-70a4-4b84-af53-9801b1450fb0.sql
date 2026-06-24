REVOKE SELECT, UPDATE, DELETE ON public.quote_requests FROM anon, authenticated;
CREATE POLICY "Deny public read access to quote requests" ON public.quote_requests FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny public update access to quote requests" ON public.quote_requests FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny public delete access to quote requests" ON public.quote_requests FOR DELETE TO anon, authenticated USING (false);