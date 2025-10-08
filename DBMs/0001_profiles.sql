DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;

create table public.profiles
(
  id                uuid not null references auth.users on delete cascade,
  name              text,
  profile_image_url text,
  email             text,
  primary key (id)
);

alter table public.profiles
  enable row level security;

-- Create a policy to allow authenticated users to select their own profile
DROP POLICY IF EXISTS "Allow authenticated users to select their own profile" on public.profiles;
CREATE POLICY "Allow authenticated users to select their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create a policy to allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" on public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy to allow authenticated users to delete their own profile
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profile" on public.profiles;
CREATE POLICY "Allow authenticated users to delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- inserts a row into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
BEGIN

  -- if provider is Google
  IF NEW.raw_app_meta_data ->> 'provider' = 'google' THEN
    INSERT INTO public.profiles (id, email, name, profile_image_url, created)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'avatar_url', CURRENT_TIMESTAMP);
  ELSE
    -- else insert random name
    INSERT INTO public.profiles (id, email, name, profile_image_url, created)
    VALUES (NEW.id,
            NEW.email,
            substring(
              string_agg(chr(65 + floor(random() * 26)::int), ''), -- Random letters (A-Z)
              1, 10 -- 10-character random name
            ),
            '',
            CURRENT_TIMESTAMP);
  END IF;

  RETURN NEW;
END;
$$;


-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert
  on auth.users
  for each row
execute procedure public.handle_new_user();

-- Insert data into public.profiles from auth.users
INSERT INTO public.profiles (id, email, name, profile_image_url)
SELECT id,
       email,
       CASE
         -- If provider is Google, use the name from raw_user_meta_data
         WHEN raw_app_meta_data ->> 'provider' = 'google' THEN raw_user_meta_data ->> 'name'
         -- Otherwise, generate a random name
         ELSE substring(
           string_agg(chr(65 + floor(random() * 26)::int), ''), -- Random letters (A-Z)
           1, 10 -- 10-character random name
              )
         END,
       CASE
         -- If provider is Google, use the avatar_url from raw_user_meta_data
         WHEN raw_app_meta_data ->> 'provider' = 'google' THEN raw_user_meta_data ->> 'avatar_url'
         ELSE '' -- No profile image URL for non-Google users
         END
FROM auth.users
group by id;
