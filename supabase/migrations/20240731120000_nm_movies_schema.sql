-- N&M Movies core schema with valid Postgres array types and enforced relationships

-- Profiles align directly to Supabase auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'member',
  invite_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Movie catalog
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  detail text,
  genre text,
  genres text[] not null default '{}',
  type text not null default 'Movie',
  year integer,
  rating text,
  runtime text,
  availability text not null default 'Request',
  platform text,
  usb_location text,
  watch_options jsonb not null default '[]'::jsonb,
  poster text,
  director text,
  cast_members text[] not null default '{}',
  gallery text[] not null default '{}',
  trailer_id text,
  score numeric(3,1) default 0,
  popularity numeric default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Viewing history
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete cascade,
  progress integer default 0,
  completed boolean not null default false,
  watched_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint history_user_movie_key unique (user_id, movie_id)
);

-- Ratings
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete cascade,
  rating numeric(2,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_user_movie_key unique (user_id, movie_id)
);

-- Watchlists
create table if not exists public.watchlist (
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

-- Favorites
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

-- Requests submitted by members
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  requester_email text,
  message text,
  delivery_method text,
  status text not null default 'OPEN',
  type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invitation codes for gated onboarding
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null unique,
  role text not null default 'member',
  revoked boolean not null default false,
  used_at timestamptz,
  used_by uuid references auth.users (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Admin users mapped to real accounts
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_user_id_key unique (user_id)
);

-- Admin control over catalog status
create table if not exists public.admin_movies (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies (id) on delete cascade,
  status text not null default 'ACTIVE',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_movies_movie_id_key unique (movie_id)
);

-- Admin processing of member requests
create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  assigned_to uuid references auth.users (id),
  status text not null default 'OPEN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_requests_request_id_key unique (request_id)
);

-- Metrics surfaced in the admin dashboard
create table if not exists public.admin_metrics (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  value numeric,
  metadata jsonb default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

-- Social reviews
create table if not exists public.social_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id uuid not null references public.movies (id) on delete cascade,
  rating numeric(2,1),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_reviews_user_movie_key unique (user_id, movie_id)
);

-- Social following graph
create table if not exists public.social_following (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint social_following_pair_key unique (follower_id, followed_id)
);

-- Shareable curated lists
create table if not exists public.shareable_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  movies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
