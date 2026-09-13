-- Tier 2–4 grocery ops: stock qty, unit pricing, variants, brand/dietary,
-- checkout prefs (substitution, pickup slot, tip), announcements, bundles, recipes.
-- Safe to re-run.

-- ── Products ───────────────────────────────────────────────────────────────
alter table products
  add column if not exists brand text,
  add column if not exists dietary_tags text[] not null default '{}',
  add column if not exists stock_quantity integer,
  add column if not exists unit_amount numeric(10, 3),
  add column if not exists unit_of_measure text,
  add column if not exists pack_label text,
  add column if not exists variant_group text;

comment on column products.brand is 'Brand for filters (e.g. Tropiway).';
comment on column products.dietary_tags is 'Tags: vegetarian, vegan, gluten_free, halal, spicy.';
comment on column products.stock_quantity is 'Null = use in_stock boolean only. When set, drives low-stock UI.';
comment on column products.unit_amount is 'Numeric size for unit price (e.g. 5 for 5 lb).';
comment on column products.unit_of_measure is 'lb | oz | kg | g | ct | ml | l';
comment on column products.pack_label is 'Display pack size override (e.g. 5 lb bag).';
comment on column products.variant_group is 'Shared slug linking size variants of the same item.';

create index if not exists products_brand_idx on products (brand);
create index if not exists products_variant_group_idx on products (variant_group);
create index if not exists products_dietary_tags_gin on products using gin (dietary_tags);

-- Keep in_stock in sync when quantity is tracked.
create or replace function products_sync_in_stock_from_qty()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity is not null then
    new.in_stock := new.stock_quantity > 0;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_in_stock_trg on products;
create trigger products_sync_in_stock_trg
  before insert or update of stock_quantity
  on products
  for each row
  execute function products_sync_in_stock_from_qty();

-- ── Orders (checkout extras) ───────────────────────────────────────────────
alter table orders
  add column if not exists substitution_pref text,
  add column if not exists pickup_slot text,
  add column if not exists tip_amount numeric(10, 2) not null default 0;

comment on column orders.substitution_pref is 'refund | call | substitute';
comment on column orders.pickup_slot is 'Customer-selected pickup window label.';
comment on column orders.tip_amount is 'Driver tip for local delivery (and optional pickup tip).';

-- ── Announcement bar (admin-managed) ───────────────────────────────────────
create table if not exists site_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  href text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table site_announcements is 'Rotating storefront announcement bar messages.';

alter table site_announcements enable row level security;

drop policy if exists "Public read active announcements" on site_announcements;
create policy "Public read active announcements"
  on site_announcements for select
  using (active = true);

-- Seed defaults only when empty.
insert into site_announcements (message, href, sort_order)
select * from (values
  ('Nationwide shipping · Free standard on $120+ · Pickup in Columbus', null::text, 0),
  ('Mobile market & Ohio delivery — call the store', '/#mobile-market', 1),
  ('Insurance, notary & more services — by appointment', '/#services', 2),
  ('Store pickup · 1668 E Dublin Granville Rd, Columbus, OH 43229', null::text, 3)
) as v(message, href, sort_order)
where not exists (select 1 from site_announcements limit 1);

-- ── Bundles / kits ─────────────────────────────────────────────────────────
create table if not exists product_bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  discount_percent numeric(5, 2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references product_bundles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (bundle_id, product_id)
);

alter table product_bundles enable row level security;
alter table product_bundle_items enable row level security;

drop policy if exists "Public read active bundles" on product_bundles;
create policy "Public read active bundles"
  on product_bundles for select
  using (active = true);

drop policy if exists "Public read bundle items" on product_bundle_items;
create policy "Public read bundle items"
  on product_bundle_items for select
  using (
    exists (
      select 1 from product_bundles b
      where b.id = bundle_id and b.active = true
    )
  );

-- ── Recipes ────────────────────────────────────────────────────────────────
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  body_md text not null default '',
  image_url text,
  prep_minutes integer,
  cook_minutes integer,
  servings integer,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  label text not null,
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0
);

alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

drop policy if exists "Public read active recipes" on recipes;
create policy "Public read active recipes"
  on recipes for select
  using (active = true);

drop policy if exists "Public read recipe ingredients" on recipe_ingredients;
create policy "Public read recipe ingredients"
  on recipe_ingredients for select
  using (
    exists (
      select 1 from recipes r
      where r.id = recipe_id and r.active = true
    )
  );

-- Seed starter recipes (ingredients linked later in admin by product_id).
insert into recipes (slug, title, summary, body_md, prep_minutes, cook_minutes, servings, sort_order)
select * from (values
  (
    'egusi-soup',
    'Egusi soup',
    'Classic West African melon-seed stew. Pair with fufu or rice.',
    E'## Steps\n\n1. Blend egusi with a little water into a thick paste.\n2. Sauté onion, pepper, and tomato base until reduced.\n3. Add stock, leafy greens, and protein.\n4. Drop spoonfuls of egusi paste; simmer until oil rises.\n5. Season and serve with fufu, pounded yam, or rice.',
    20,
    45,
    4,
    0
  ),
  (
    'jollof-rice',
    'Jollof rice',
    'Party-style one-pot rice with tomato pepper base.',
    E'## Steps\n\n1. Blend tomato, pepper, and onion.\n2. Fry the base in oil until deep red and thick.\n3. Add rice, stock, and seasoning; cover and steam.\n4. Fluff and rest 5 minutes before serving.',
    15,
    40,
    6,
    1
  ),
  (
    'plantain-fufu-night',
    'Plantain & fufu night',
    'Quick weeknight plate: ripe plantain with fufu and stew.',
    E'## Steps\n\n1. Peel and fry ripe plantain until golden.\n2. Prepare fufu flour per package directions.\n3. Warm stew or soup and plate together.',
    10,
    25,
    2,
    2
  )
) as v(slug, title, summary, body_md, prep_minutes, cook_minutes, servings, sort_order)
where not exists (select 1 from recipes where slug = v.slug);

-- Soft ingredient labels (no product_id) for the seeded recipes.
insert into recipe_ingredients (recipe_id, label, quantity, sort_order)
select r.id, i.label, i.quantity, i.sort_order
from recipes r
join (values
  ('egusi-soup', 'Egusi (melon seed)', 1, 0),
  ('egusi-soup', 'Palm oil', 1, 1),
  ('egusi-soup', 'Stockfish or protein', 1, 2),
  ('egusi-soup', 'Leafy greens', 1, 3),
  ('egusi-soup', 'Fufu flour', 1, 4),
  ('jollof-rice', 'Long grain rice', 1, 0),
  ('jollof-rice', 'Tomato / pepper mix', 1, 1),
  ('jollof-rice', 'Vegetable oil', 1, 2),
  ('jollof-rice', 'Seasoning / stock', 1, 3),
  ('plantain-fufu-night', 'Ripe plantain', 1, 0),
  ('plantain-fufu-night', 'Fufu flour', 1, 1),
  ('plantain-fufu-night', 'Stew or soup base', 1, 2)
) as i(slug, label, quantity, sort_order) on r.slug = i.slug
where not exists (
  select 1 from recipe_ingredients ri where ri.recipe_id = r.id
);

-- ── Fuzzy search (pg_trgm) ─────────────────────────────────────────────────
create extension if not exists pg_trgm;

create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);

create or replace function search_products_fuzzy(search_query text, result_limit integer default 24)
returns setof products
language sql
stable
as $$
  select p.*
  from products p
  where
    p.name % search_query
    or p.name ilike '%' || search_query || '%'
    or coalesce(p.category, '') ilike '%' || search_query || '%'
    or coalesce(p.brand, '') ilike '%' || search_query || '%'
    or coalesce(p.description, '') ilike '%' || search_query || '%'
  order by
    similarity(p.name, search_query) desc,
    p.in_stock desc,
    p.name asc
  limit greatest(1, least(coalesce(result_limit, 24), 60));
$$;

grant execute on function search_products_fuzzy(text, integer) to anon, authenticated;
