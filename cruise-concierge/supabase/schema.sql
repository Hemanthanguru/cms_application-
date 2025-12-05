-- Drop trigger if it already exists
drop trigger if exists on_auth_user_created on auth.users;

-- Drop function if it already exists
drop function if exists public.handle_new_user();

-- Create a table for user roles if it doesn't exist
create table if not exists public.user_roles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null check (role in ('admin', 'manager', 'head_cook', 'supervisor', 'voyager')),
  email text, -- Added email column for easier identification
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can read their own role" on public.user_roles;
drop policy if exists "Admins can read all roles" on public.user_roles;

-- Create policies for user_roles
create policy "Users can read their own role"
  on public.user_roles for select
  using (auth.uid() = id);

create policy "Admins can read all roles"
  on public.user_roles for select
  using (exists (select 1 from public.user_roles where id = auth.uid() and role = 'admin'));

-- Function to handle new user signup with SECRET KEY CHECK
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
  provided_key text;
  valid_key text := '2004'; -- Secret key for privileged roles
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'voyager');
  provided_key := new.raw_user_meta_data->>'secret_key';

  -- If a privileged role is requested, verify the secret key
  if requested_role in ('admin', 'manager', 'head_cook', 'supervisor') then
    if provided_key is null or provided_key <> valid_key then
      -- Invalid key: Fallback to 'voyager' role
      requested_role := 'voyager'; 
    end if;
  end if;

  insert into public.user_roles (id, role, email)
  values (new.id, requested_role, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Items table (for Catering and Stationery)
create table if not exists public.items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text not null check (category in ('catering', 'stationery')),
  price decimal(10, 2) not null,
  stock integer default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.items enable row level security;

drop policy if exists "Anyone can view items" on public.items;
drop policy if exists "Admins and Managers can insert items" on public.items;
drop policy if exists "Admins and Managers can update items" on public.items;
drop policy if exists "Admins and Managers can delete items" on public.items;

create policy "Anyone can view items"
  on public.items for select
  using (true);

create policy "Admins and Managers can insert items"
  on public.items for insert
  with check (exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager')));

create policy "Admins and Managers can update items"
  on public.items for update
  using (exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager')));

create policy "Admins and Managers can delete items"
  on public.items for delete
  using (exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager')));

-- Orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('catering', 'stationery')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'preparing', 'delivered', 'cancelled')),
  total_amount decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Staff can view relevant orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Staff can update orders" on public.orders;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Staff can view relevant orders"
  on public.orders for select
  using (
    (type = 'catering' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'head_cook'))) or
    (type = 'stationery' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'supervisor')))
  );

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Staff can update orders"
  on public.orders for update
  using (
    (type = 'catering' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'head_cook'))) or
    (type = 'stationery' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'supervisor')))
  );

-- Order Items table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  item_id uuid references public.items not null,
  quantity integer not null,
  price_at_time decimal(10, 2) not null
);

alter table public.order_items enable row level security;

drop policy if exists "Users can view their own order items" on public.order_items;
drop policy if exists "Staff can view order items" on public.order_items;
drop policy if exists "Users can create order items" on public.order_items;

create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid()));

create policy "Staff can view order items"
  on public.order_items for select
  using (exists (select 1 from public.orders where id = order_items.order_id and (
    (type = 'catering' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'head_cook'))) or
    (type = 'stationery' and exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager', 'supervisor')))
  )));

create policy "Users can create order items"
  on public.order_items for insert
  with check (exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid()));

-- Bookings table (Movies, Salon, Fitness, Party Hall)
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('movie', 'salon', 'fitness', 'party_hall')),
  date date not null,
  time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  details jsonb, -- Stores specific details like movie title, service type, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bookings enable row level security;

drop policy if exists "Users can view their own bookings" on public.bookings;
drop policy if exists "Managers and Admins can view all bookings" on public.bookings;
drop policy if exists "Users can create bookings" on public.bookings;
drop policy if exists "Managers and Admins can update bookings" on public.bookings;

create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Managers and Admins can view all bookings"
  on public.bookings for select
  using (exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager')));

create policy "Users can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Managers and Admins can update bookings"
  on public.bookings for update
  using (exists (select 1 from public.user_roles where id = auth.uid() and role in ('admin', 'manager')));
