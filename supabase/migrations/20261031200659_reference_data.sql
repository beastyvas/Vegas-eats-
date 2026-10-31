-- Reference data (edit via admin later; this is just the starting set)
insert into public.areas (slug, name, centroid_lat, centroid_lng, blurb, sort) values
  ('downtown-arts-district', 'Downtown / Arts District', 36.1626, -115.15, 'Fremont East, the Arts District, and old-school Vegas blocks.', 0),
  ('east-side', 'East Side', 36.164, -115.09, 'East Las Vegas: taquerias, panaderías, and family spots off Charleston and Nellis.', 10),
  ('chinatown', 'Chinatown / Spring Mountain', 36.126, -115.198, 'Spring Mountain Road''s late-night strip of family-run kitchens.', 20),
  ('spring-valley', 'Spring Valley', 36.108, -115.245, 'Strip-mall gems west of the Strip.', 30),
  ('summerlin', 'Summerlin', 36.165, -115.315, 'West valley neighborhoods along the 215.', 40),
  ('centennial-hills', 'Centennial Hills', 36.29, -115.27, 'Northwest valley, up by the mountains.', 50),
  ('northwest', 'Northwest', 36.225, -115.24, 'Lone Mountain, Rancho, and the northwest corridor.', 60),
  ('north-las-vegas', 'North Las Vegas', 36.24, -115.12, 'NLV: home-cooked, truck-heavy, under-the-radar.', 70),
  ('southwest', 'Southwest', 36.045, -115.26, 'Mountain''s Edge, Enterprise, Rhodes Ranch, and the southwest build-out.', 80),
  ('henderson', 'Henderson', 36.03, -115.04, 'Green Valley, Anthem, Old Henderson, and Water Street.', 90),
  ('paradise-unlv', 'Paradise / UNLV', 36.11, -115.14, 'University district and Maryland Parkway.', 100);

insert into public.categories (slug, name, emoji, sort) values
  ('texas-bbq', 'Texas BBQ', '🔥', 0),
  ('soul-food', 'Soul Food', '🍗', 10),
  ('birria-tacos', 'Birria & Tacos', '🌮', 20),
  ('pizza', 'Pizza', '🍕', 30),
  ('mexican', 'Mexican', '🌶️', 40),
  ('filipino', 'Filipino', '🍢', 50),
  ('bakery-desserts', 'Bakery & Desserts', '🧁', 60),
  ('vegan', 'Vegan & Plant-Based', '🥬', 70),
  ('caribbean', 'Caribbean', '🌴', 80),
  ('burgers', 'Burgers', '🍔', 90),
  ('hawaiian', 'Hawaiian & Island', '🌺', 100),
  ('korean', 'Korean', '🥢', 110),
  ('thai', 'Thai', '🍜', 120),
  ('vietnamese', 'Vietnamese', '🍲', 130),
  ('chinese', 'Chinese', '🥟', 140),
  ('central-american', 'Central American', '🫓', 150),
  ('wings', 'Wings', '🍗', 160),
  ('seafood', 'Seafood', '🦐', 170),
  ('breakfast', 'Breakfast & Brunch', '🍳', 180),
  ('coffee-drinks', 'Coffee & Drinks', '☕', 190),
  ('ethiopian-african', 'African', '🍛', 200),
  ('mediterranean', 'Mediterranean', '🧆', 210),
  ('sandwiches', 'Sandwiches & Deli', '🥪', 220),
  ('snacks-street', 'Snacks & Street Eats', '🍡', 230);

-- Las Vegas Valley zips (Clark County valley + Henderson/NLV/Boulder City). Vouches from these count fully.
insert into public.valley_zips (zip) values ('89002'), ('89005'), ('89011'), ('89012'), ('89014'), ('89015'), ('89030'), ('89031'), ('89032'), ('89033'), ('89036'), ('89044'), ('89052'), ('89074'), ('89077'), ('89081'), ('89084'), ('89085'), ('89086'), ('89087'), ('89101'), ('89102'), ('89103'), ('89104'), ('89105'), ('89106'), ('89107'), ('89108'), ('89109'), ('89110'), ('89111'), ('89112'), ('89113'), ('89114'), ('89115'), ('89116'), ('89117'), ('89118'), ('89119'), ('89120'), ('89121'), ('89122'), ('89123'), ('89124'), ('89125'), ('89126'), ('89127'), ('89128'), ('89129'), ('89130'), ('89131'), ('89132'), ('89133'), ('89134'), ('89135'), ('89136'), ('89137'), ('89138'), ('89139'), ('89140'), ('89141'), ('89142'), ('89143'), ('89144'), ('89145'), ('89146'), ('89147'), ('89148'), ('89149'), ('89150'), ('89151'), ('89152'), ('89153'), ('89154'), ('89155'), ('89156'), ('89157'), ('89158'), ('89159'), ('89160'), ('89161'), ('89162'), ('89163'), ('89164'), ('89165'), ('89166'), ('89167'), ('89168'), ('89169'), ('89170'), ('89171'), ('89172'), ('89173'), ('89174'), ('89175'), ('89176'), ('89177'), ('89178'), ('89179'), ('89180'), ('89181'), ('89182'), ('89183'), ('89184'), ('89185'), ('89186'), ('89187'), ('89188'), ('89189'), ('89190'), ('89191'), ('89192'), ('89193'), ('89194'), ('89195'), ('89196'), ('89197'), ('89198'), ('89199');
