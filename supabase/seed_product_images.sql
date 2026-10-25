-- Fills in product photos for any product that still has none.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run. Re-runnable:
-- it only touches rows where image_url is null, so hand-picked photos survive.
--
-- picsum.photos serves a stable photo per seed, and the seed is derived from the
-- product name, so each product keeps the same picture across runs. These are
-- placeholders, not real product shots - replace any row's image_url with a real
-- photo URL whenever you have one. The host must also be listed in
-- next.config.ts -> images.remotePatterns, or next/image will refuse to load it
-- (picsum.photos, images.unsplash.com and this project's Supabase Storage are
-- already allowed).

update public.products
   set image_url = 'https://picsum.photos/seed/'
                || regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
                || '/800/800'
 where image_url is null;

select name, image_url from public.products order by name;
