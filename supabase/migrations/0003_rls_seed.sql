-- ============================================================
--  Row-Level Security, column privileges, and seed data.
-- ============================================================

alter table profiles       enable row level security;
alter table topics         enable row level security;
alter table topic_members  enable row level security;
alter table posts          enable row level security;
alter table comments       enable row level security;
alter table votes          enable row level security;
alter table saves          enable row level security;
alter table follows        enable row level security;
alter table notifications  enable row level security;
alter table reports        enable row level security;
alter table bans           enable row level security;
alter table badges         enable row level security;
alter table user_badges    enable row level security;
alter table tags           enable row level security;
alter table post_tags      enable row level security;
alter table poll_options   enable row level security;
alter table poll_votes     enable row level security;
alter table media          enable row level security;
alter table mod_audit_log  enable row level security;
alter table site_settings  enable row level security;

-- ── PROFILES ─────────────────────────────────────────────────
create policy profiles_read   on profiles for select using (true);
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ── TOPICS (admin mutates via service role) ──────────────────
create policy topics_read on topics for select using (true);

-- ── TOPIC MEMBERS ────────────────────────────────────────────
create policy topic_members_read   on topic_members for select using (true);
create policy topic_members_join   on topic_members for insert with check (user_id = auth.uid());
create policy topic_members_leave  on topic_members for delete using (user_id = auth.uid());

-- ── POSTS ────────────────────────────────────────────────────
create policy posts_read on posts for select
  using (not is_removed or author_id = auth.uid() or is_moderator(auth.uid(), topic_id));
create policy posts_insert on posts for insert
  with check (author_id = auth.uid()
    and not is_user_banned(auth.uid())
    and check_rate_limit(auth.uid(), 'post'));
create policy posts_update on posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete on posts for delete using (author_id = auth.uid());

-- ── COMMENTS ─────────────────────────────────────────────────
create policy comments_read on comments for select
  using (not is_removed or author_id = auth.uid());
create policy comments_insert on comments for insert
  with check (author_id = auth.uid()
    and not is_user_banned(auth.uid())
    and check_rate_limit(auth.uid(), 'comment'));
create policy comments_update on comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on comments for delete using (author_id = auth.uid());

-- ── VOTES ────────────────────────────────────────────────────
create policy votes_read   on votes for select using (user_id = auth.uid());
create policy votes_insert on votes for insert with check (user_id = auth.uid());
create policy votes_update on votes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy votes_delete on votes for delete using (user_id = auth.uid());

-- ── SAVES ────────────────────────────────────────────────────
create policy saves_read   on saves for select using (user_id = auth.uid());
create policy saves_insert on saves for insert with check (user_id = auth.uid());
create policy saves_delete on saves for delete using (user_id = auth.uid());

-- ── FOLLOWS ──────────────────────────────────────────────────
create policy follows_read   on follows for select using (true);
create policy follows_insert on follows for insert with check (follower_id = auth.uid());
create policy follows_delete on follows for delete using (follower_id = auth.uid());

-- ── NOTIFICATIONS ────────────────────────────────────────────
create policy notifications_read   on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on notifications for delete using (user_id = auth.uid());

-- ── REPORTS ──────────────────────────────────────────────────
create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_read on reports for select
  using (reporter_id = auth.uid() or is_admin(auth.uid()));

-- ── BANS ─────────────────────────────────────────────────────
create policy bans_read on bans for select
  using (user_id = auth.uid() or is_admin(auth.uid()));

-- ── BADGES ───────────────────────────────────────────────────
create policy badges_read      on badges      for select using (true);
create policy user_badges_read on user_badges for select using (true);

-- ── TAGS ─────────────────────────────────────────────────────
create policy tags_read   on tags for select using (true);
create policy tags_insert on tags for insert with check (auth.uid() is not null);
create policy post_tags_read on post_tags for select using (true);
create policy post_tags_insert on post_tags for insert
  with check (exists (select 1 from posts where id = post_id and author_id = auth.uid()));
create policy post_tags_delete on post_tags for delete
  using (exists (select 1 from posts where id = post_id and author_id = auth.uid()));

-- ── POLLS ────────────────────────────────────────────────────
create policy poll_options_read on poll_options for select using (true);
create policy poll_options_insert on poll_options for insert
  with check (exists (select 1 from posts where id = post_id and author_id = auth.uid()));
create policy poll_votes_read   on poll_votes for select using (user_id = auth.uid());
create policy poll_votes_insert on poll_votes for insert with check (user_id = auth.uid());
create policy poll_votes_delete on poll_votes for delete using (user_id = auth.uid());

-- ── MEDIA ────────────────────────────────────────────────────
create policy media_read   on media for select using (true);
create policy media_insert on media for insert with check (owner_id = auth.uid());
create policy media_delete on media for delete using (owner_id = auth.uid());

-- ── AUDIT / SETTINGS ─────────────────────────────────────────
create policy mod_audit_read on mod_audit_log for select using (is_admin(auth.uid()));
create policy site_settings_read on site_settings for select using (true);

-- ── COLUMN PRIVILEGES (protect counters / role / karma) ──────
revoke insert, update on posts from anon, authenticated;
grant insert (author_id, topic_id, title, body, body_text, post_type, link_url)
  on posts to authenticated;
grant update (title, body, body_text, post_type, link_url, edited_at)
  on posts to authenticated;

revoke insert, update on comments from anon, authenticated;
grant insert (post_id, author_id, parent_id, body, body_text)
  on comments to authenticated;
grant update (body, body_text, edited_at) on comments to authenticated;

revoke update on profiles from anon, authenticated;
grant update (display_name, avatar_url, banner_url, bio, username, onboarded, last_seen)
  on profiles to authenticated;

-- ============================================================
--  SEED DATA
-- ============================================================
insert into topics (slug, name, description, icon, sort_order) values
  ('paper-leaks', 'Paper Leaks & Exam Fraud', 'NEET, SSC, RRB, TET — leaks, scams, and the fight for clean exams.', 'file-warning', 1),
  ('recruitment-delays', 'Recruitment Delays', 'Stuck notifications, frozen vacancies, endless waiting.', 'hourglass', 2),
  ('unemployment', 'Unemployment', 'The job hunt, rejection, and financial pressure.', 'briefcase', 3),
  ('mental-health', 'Mental Health & Exam Stress', 'Pressure, failure, family expectations — you are not alone.', 'heart-pulse', 4),
  ('aspirant-life', 'Aspirant Life', 'Coaching, attempts, preparation, the daily grind.', 'book-open', 5),
  ('wins', 'Wins & Survival', 'Selections, small victories, and hum-girenge-nahi stories.', 'trophy', 6),
  ('demands', 'Demands & Action', 'Discussion around the movement''s official demands.', 'megaphone', 7),
  ('help', 'Help & Resources', 'Scholarship, helpline, and mentorship questions.', 'life-buoy', 8);

insert into badges (slug, name, description, icon, karma_threshold, is_auto) values
  ('founding-member', 'Founding Member', 'Here from the very start.', 'star', null, false),
  ('rising-voice', 'Rising Voice', 'Earned 50 karma in the community.', 'trending-up', 50, true),
  ('trusted-member', 'Trusted Member', 'Earned 250 karma in the community.', 'shield-check', 250, true),
  ('community-pillar', 'Community Pillar', 'Earned 1000 karma in the community.', 'award', 1000, true);

insert into tags (slug, name) values
  ('neet-2026', 'neet-2026'), ('ssc-cgl', 'ssc-cgl'),
  ('teacher-recruitment', 'teacher-recruitment'), ('exam-stress', 'exam-stress'),
  ('paper-leak-law', 'paper-leak-law'), ('motivation', 'motivation'),
  ('advice', 'advice'), ('resources', 'resources'), ('helpline', 'helpline'),
  ('tet', 'tet'), ('family', 'family'), ('verified', 'verified');

insert into site_settings (id, crisis_resources) values (1,
  '[
    {"name":"Tele-MANAS","detail":"Government of India · 24/7 mental health support, regional languages","contact":"14416 / 1-800-891-4416"},
    {"name":"KIRAN Mental Health Helpline","detail":"Ministry of Social Justice · 24/7, free","contact":"1800-599-0019"},
    {"name":"Vandrevala Foundation","detail":"24/7 confidential counselling support","contact":"1860-2662-345 / 1800-2333-330"},
    {"name":"iCall (TISS)","detail":"Psychosocial helpline · Mon–Sat, 10am–8pm","contact":"9152987821"},
    {"name":"AASRA","detail":"24/7 helpline for those in distress","contact":"9820466726"}
  ]'::jsonb);
