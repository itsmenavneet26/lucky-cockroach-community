"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Upload, X, Loader2 } from "lucide-react";
import { updateAppearance } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import type { Announcement, HomeHero, VolunteerHero } from "@/lib/types";

type State = { ok?: boolean; error?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const res = await updateAppearance(formData);
  return res.ok ? { ok: true } : { error: res.error };
}

const input =
  "w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function AppearanceForm({
  userId,
  announcement,
  homeHero,
  volunteerHero,
}: {
  userId: string;
  announcement: Announcement;
  homeHero: HomeHero;
  volunteerHero: VolunteerHero;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    {},
  );
  const [annImg, setAnnImg] = useState(announcement.image || "");
  const [homeImg, setHomeImg] = useState(homeHero.image || "");
  const [volImg, setVolImg] = useState(volunteerHero.image || "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="ann_image" value={annImg} />
      <input type="hidden" name="home_image" value={homeImg} />
      <input type="hidden" name="vol_image" value={volImg} />

      {/* Announcement bar */}
      <Section title="Announcement bar" desc="A site-wide banner shown at the top of every page.">
        <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            name="ann_enabled"
            defaultChecked={announcement.enabled}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Show the announcement bar
        </label>
        <Field label="Message">
          <input
            name="ann_text"
            defaultValue={announcement.text}
            placeholder="e.g. NEET 2026 re-exam update — read the verified facts"
            className={input}
          />
        </Field>
        <Field label="Link (optional)">
          <input
            name="ann_href"
            defaultValue={announcement.href}
            placeholder="/post/… or https://…"
            className={input}
          />
        </Field>
        <ImageField label="Banner image (optional)" value={annImg} onChange={setAnnImg} userId={userId} />
      </Section>

      {/* Home hero */}
      <Section title="Home hero banner" desc="The large banner at the top of the community home feed.">
        <Field label="Heading">
          <input name="home_heading" defaultValue={homeHero.heading} required className={input} />
        </Field>
        <Field label="Text">
          <textarea name="home_text" defaultValue={homeHero.text} rows={2} className={input} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Button label">
            <input name="home_cta_label" defaultValue={homeHero.cta_label} className={input} />
          </Field>
          <Field label="Button link">
            <input name="home_cta_href" defaultValue={homeHero.cta_href} className={input} />
          </Field>
        </div>
        <ImageField label="Hero image (optional)" value={homeImg} onChange={setHomeImg} userId={userId} />
      </Section>

      {/* Volunteer hero */}
      <Section title="Volunteer page hero" desc="The banner at the top of the Volunteer page.">
        <Field label="Heading">
          <input name="vol_heading" defaultValue={volunteerHero.heading} required className={input} />
        </Field>
        <Field label="Text">
          <textarea name="vol_text" defaultValue={volunteerHero.text} rows={2} className={input} />
        </Field>
        <ImageField label="Hero image (optional)" value={volImg} onChange={setVolImg} userId={userId} />
      </Section>

      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-[13px] text-positive">
          <CheckCircle2 size={15} /> Appearance saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save appearance"}
      </button>
    </form>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <p className="text-[13px] text-muted">{desc}</p>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {children}
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  userId,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  userId: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/site-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div>
      <span className="mb-1 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-28 rounded-[var(--radius)] border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <label className="flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-2 text-[13px] text-muted hover:border-accent">
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Upload size={16} /> Upload image
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
