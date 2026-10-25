-- Dummy data: fills out the product catalog across 5 categories so the
-- category filter on /featured_products has something to filter.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: only inserts, no table changes.

insert into public.products (name, description, price, image_url, category, rating, stock) values
  -- Electronics
  ('Bluetooth Portable Speaker', 'Compact waterproof speaker with 20-hour battery and rich bass. Pairs with two devices at once.', 59.99, null, 'Electronics', 4.4, 90),
  ('Smartwatch Series 5', 'Fitness tracking, heart-rate monitor, and always-on display. 5-day battery life.', 199.99, null, 'Electronics', 4.6, 55),
  ('Wireless Charging Pad', 'Fast-charge any Qi-enabled phone or earbuds case. Slim aluminum design.', 24.99, null, 'Electronics', 4.2, 120),

  -- Footwear
  ('Trail Hiking Boots', 'Waterproof leather boots with reinforced ankle support for rugged terrain.', 149.99, null, 'Footwear', 4.6, 40),
  ('Classic Canvas Sneakers', 'Everyday low-top sneakers with a durable rubber sole and cotton canvas upper.', 54.99, null, 'Footwear', 4.3, 110),

  -- Accessories
  ('Leather Bifold Wallet', 'Full-grain leather wallet with RFID-blocking lining and six card slots.', 39.99, null, 'Accessories', 4.5, 85),
  ('Polarized Sunglasses', 'UV400 polarized lenses with a lightweight scratch-resistant frame.', 44.99, null, 'Accessories', 4.4, 95),

  -- Home
  ('Ceramic Coffee Mug Set', 'Set of 4 hand-glazed 12oz mugs, microwave and dishwasher safe.', 29.99, null, 'Home', 4.7, 70),
  ('Scented Soy Candle', 'Hand-poured soy wax candle with a 45-hour burn time, sandalwood scent.', 18.99, null, 'Home', 4.5, 130),
  ('Cotton Throw Blanket', 'Soft woven throw blanket, 50x60in, machine washable.', 34.99, null, 'Home', 4.6, 60),
  ('Non-Stick Cookware Set', '8-piece non-stick pot and pan set with tempered glass lids.', 119.99, null, 'Home', 4.3, 25),
  ('Bamboo Cutting Board', 'Eco-friendly bamboo board with built-in juice groove, set of 3 sizes.', 27.99, null, 'Home', 4.8, 100),

  -- Beauty
  ('Hydrating Face Serum', 'Hyaluronic acid serum for daily hydration, suitable for all skin types.', 22.99, null, 'Beauty', 4.5, 140),
  ('Matte Lipstick Set', 'Set of 6 long-wearing matte lipsticks in versatile everyday shades.', 32.99, null, 'Beauty', 4.4, 75),
  ('Argan Oil Hair Mask', 'Deep-conditioning weekly hair mask with cold-pressed argan oil.', 19.99, null, 'Beauty', 4.6, 65),
  ('Vitamin C Moisturizer', 'Brightening daily moisturizer with vitamin C and SPF 30.', 26.99, null, 'Beauty', 4.5, 90),
  ('Bamboo Makeup Brush Set', '10-piece cruelty-free makeup brush set with a bamboo handle and travel case.', 24.99, null, 'Beauty', 4.3, 80);
