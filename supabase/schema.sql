-- ==============================================================================
-- PERSONAL BUDGET APP - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Default Currency: BRL (Brazilian Real, R$)
-- Authentication Mode: Email & Password (with Password Recovery)
-- ==============================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  monthly_budget_goal NUMERIC(12, 2) DEFAULT 3000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means default system category
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Users can view default categories and their own categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);


-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);


-- 4. Initial Default System Categories (BRL localized)
INSERT INTO public.categories (name, type, color, icon, user_id)
VALUES
  -- Income categories
  ('Salário', 'income', '#10b981', 'Briefcase', NULL),
  ('Investimentos', 'income', '#06b6d4', 'TrendingUp', NULL),
  ('Freelance / Extra', 'income', '#8b5cf6', 'Laptop', NULL),
  ('Outros Ganhos', 'income', '#34d399', 'PlusCircle', NULL),

  -- Expense categories
  ('Alimentação & Mercado', 'expense', '#f59e0b', 'Utensils', NULL),
  ('Moradia & Contas', 'expense', '#ef4444', 'Home', NULL),
  ('Transporte', 'expense', '#3b82f6', 'Car', NULL),
  ('Lazer & Entretenimento', 'expense', '#ec4899', 'Film', NULL),
  ('Saúde & Bem-estar', 'expense', '#14b8a6', 'HeartPulse', NULL),
  ('Educação', 'expense', '#6366f1', 'GraduationCap', NULL),
  ('Compras Pessoais', 'expense', '#a855f7', 'ShoppingBag', NULL),
  ('Outras Despesas', 'expense', '#64748b', 'CreditCard', NULL)
ON CONFLICT DO NOTHING;


-- 5. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'BRL'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
