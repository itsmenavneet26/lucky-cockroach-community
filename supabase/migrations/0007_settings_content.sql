-- ============================================================
--  Admin-editable content blocks (hero banners, announcement).
-- ============================================================

alter table site_settings
  add column if not exists home_hero jsonb not null default
    '{"heading":"Join the movement. Stand with people who understand.","text":"Real stories. Real support. Real impact — from students who have been exactly where you are.","cta_label":"Learn more","cta_href":"/about","image":""}'::jsonb,
  add column if not exists volunteer_hero jsonb not null default
    '{"heading":"Volunteer with the Lucky Cockroach movement","text":"For five years this movement has run on real groundwork — not viral noise. None of it happens without volunteers.","image":""}'::jsonb;

-- announcement gains an optional image field
update site_settings
  set announcement = announcement || '{"image":""}'::jsonb
  where not (announcement ? 'image');
