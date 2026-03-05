
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Shops table (tenants)
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shop"
  ON public.shops FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create their own shop"
  ON public.shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own shop"
  ON public.shops FOR UPDATE USING (auth.uid() = owner_id);

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in-progress', 'ready', 'delivered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Security definer function for shop ownership check
CREATE OR REPLACE FUNCTION public.user_shop_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.shops WHERE owner_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view their shop services"
  ON public.services FOR SELECT USING (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can create services for their shop"
  ON public.services FOR INSERT WITH CHECK (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can update their shop services"
  ON public.services FOR UPDATE USING (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can delete their shop services"
  ON public.services FOR DELETE USING (shop_id = public.user_shop_id(auth.uid()));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  item_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'emi')),
  downpayment NUMERIC,
  finance_provider TEXT,
  finance_balance NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop sales"
  ON public.sales FOR SELECT USING (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can create sales for their shop"
  ON public.sales FOR INSERT WITH CHECK (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can update their shop sales"
  ON public.sales FOR UPDATE USING (shop_id = public.user_shop_id(auth.uid()));
CREATE POLICY "Users can delete their shop sales"
  ON public.sales FOR DELETE USING (shop_id = public.user_shop_id(auth.uid()));

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_services_shop_id ON public.services(shop_id);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_sales_shop_id ON public.sales(shop_id);
CREATE INDEX idx_sales_payment_mode ON public.sales(payment_mode);
