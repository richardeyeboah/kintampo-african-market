-- ============================================================
-- Kintampo African Market – Products Table
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text not null,
  image_url   text,
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security (required for anon key access)
alter table products enable row level security;

-- Allow anyone to read products (public store)
create policy "Public can view products"
  on products for select
  using (true);

-- ============================================================
-- Sample Products
-- ============================================================

insert into products (name, description, price, category, image_url, in_stock) values

-- Fabrics
('Ankara Print Fabric',       'Vibrant 6-yard Ankara wax print fabric, 100% cotton. Perfect for dresses, tops and traditional wear.',          25.99, 'Fabrics',    null, true),
('Kente Cloth Strip',         'Authentic hand-woven Ghanaian Kente strip in gold and green. 6 inches wide, 72 inches long.',                    49.99, 'Fabrics',    null, true),
('Tie & Dye Fabric',          'Hand-dyed indigo tie-and-dye fabric, 3 yards. Each piece is unique.',                                           18.50, 'Fabrics',    null, true),
('Adire Yoruba Fabric',       'Traditional Nigerian Adire cloth with hand-drawn batik pattern, 3 yards.',                                      22.00, 'Fabrics',    null, true),

-- Beauty & Body
('Organic Shea Butter',       'Raw unrefined Grade A shea butter from Ghana. 16 oz. Excellent for skin and hair moisturising.',                14.99, 'Beauty',     null, true),
('African Black Soap',        'Authentic handmade black soap from West Africa. 1 lb block. Good for acne, eczema and dry skin.',               12.00, 'Beauty',     null, true),
('Moringa Powder',            'Pure organic moringa leaf powder. 8 oz. Rich in vitamins and antioxidants.',                                    11.50, 'Beauty',     null, true),
('Waist Beads Set',           'Handmade traditional African waist beads, set of 3. Mixed colours with glass seed beads.',                       9.99, 'Accessories',null, true),

-- Food & Spices
('Suya Spice Blend',          'Authentic Nigerian suya spice mix (yaji). 4 oz. Perfect for grilling beef, chicken and lamb.',                   6.99, 'Spices',     null, true),
('Jollof Rice Seasoning',     'West African jollof rice spice blend. 3 oz. Makes the perfect party rice every time.',                          5.50, 'Spices',     null, true),
('Palm Oil – Red',            'Pure unrefined red palm oil from Nigeria. 32 oz bottle. Essential for Nigerian soups and stews.',               16.00, 'Food',       null, true),
('Egusi Seeds (Ground)',      'Ground melon seeds used in traditional West African soups. 12 oz pack.',                                         8.75, 'Food',       null, true),
('Dried Crayfish',            'Premium sun-dried crayfish from the Nigerian coast. 4 oz. Adds deep umami to soups.',                           7.50, 'Food',       null, true),
('Ogiri Isi (Locust Beans)',  'Fermented locust beans seasoning (dawadawa). 2 oz. Essential for authentic soup flavour.',                       4.99, 'Food',       null, true),

-- Accessories
('Beaded Necklace',           'Handcrafted Maasai-inspired multi-strand beaded necklace. Adjustable length.',                                  19.99, 'Accessories',null, true),
('Cowrie Shell Bracelet',     'Traditional cowrie shell bracelet on natural cord. One size fits most.',                                         8.00, 'Accessories',null, true);
