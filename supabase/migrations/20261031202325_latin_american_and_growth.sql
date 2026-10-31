-- Broaden "Central American" to "Latin American" (arepas, empanadas, pupusas...)
update public.categories set slug = 'latin-american', name = 'Latin American', emoji = '🫓'
where slug = 'central-american';

-- Growth path detected at import ("Truck -> restaurant"), carried into listings.growth_path on approval.
alter table public.candidates add column if not exists growth public.listing_type[] not null default '{}';
