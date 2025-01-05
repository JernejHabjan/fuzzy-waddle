
-- Drop the trigger first
DROP TRIGGER IF EXISTS after_user_registration ON auth.users;

-- Drop the function associated with the trigger
DROP FUNCTION IF EXISTS public.create_profile;

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles;

CREATE TABLE public.profiles
(
  id                bigint primary key generated always as identity,
  user_id           uuid references auth.users (id) on delete cascade,
  name              text,
  profile_image_url text,
  email             text,
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now()
) WITH (OIDS= FALSE);

-- Enable Row Level Security
ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow any user to read all profiles
DROP POLICY IF EXISTS "Allow any user to read all profiles" on public.profiles;
CREATE POLICY "Allow any user to read all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Create a policy to allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" on public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to delete their own profile
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile" on public.profiles;
CREATE POLICY "Allow authenticated users to delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index on user_id for performance
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

CREATE OR REPLACE FUNCTION public.create_profile()
  RETURNS trigger AS
$$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER after_user_registration
  AFTER INSERT
  ON auth.users
  FOR EACH ROW
EXECUTE FUNCTION public.create_profile();
