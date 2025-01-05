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
-- inserts a row into public.profiles
CREATE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS
$$
BEGIN

  -- if provider is google
  IF NEW.raw_app_meta_data ->> 'provider' = 'google' THEN
    INSERT INTO public.profiles (id, email, name, profile_image_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'avatar_url');
  ELSE
    -- else insert random name
    INSERT INTO public.profiles (id, email, name, profile_image_url)
    VALUES (NEW.id,
            NEW.email,
            substring(
              string_agg(chr(65 + floor(random() * 26)::int), ''), -- Random letters (A-Z)
              1, 10 -- 10-character random name
            ),
            '');
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
