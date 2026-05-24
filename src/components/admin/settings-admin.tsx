"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import {
  updateGeneralSettings,
  updateCrisisResources,
} from "@/lib/actions/admin";
import type { CrisisResource, SiteSettings } from "@/lib/types";

type State = { ok?: boolean; error?: string };

async function generalAction(_p: State, fd: FormData): Promise<State> {
  const res = await updateGeneralSettings(fd);
  return res.ok ? { ok: true } : { error: res.error };
}

const input =
  "w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function SettingsAdmin({ settings }: { settings: SiteSettings }) {
  return (
    <div className="flex flex-col gap-4">
      <GeneralForm settings={settings} />
      <CrisisForm initial={settings.crisis_resources} />
    </div>
  );
}

function GeneralForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<State, FormData>(
    generalAction,
    {},
  );
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft"
    >
      <h2 className="text-[15px] font-semibold text-ink">General</h2>
      <Field label="Site name">
        <input name="site_name" defaultValue={settings.site_name} className={input} required />
      </Field>
      <Field label="Tagline">
        <input name="tagline" defaultValue={settings.tagline} className={input} />
      </Field>

      <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <input
          type="checkbox"
          name="registration_open"
          defaultChecked={settings.registration_open}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Allow new member registration
      </label>

      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink">
          Post types enabled
        </p>
        <div className="flex flex-wrap gap-4">
          {(["polls", "images", "links"] as const).map((flag) => (
            <label
              key={flag}
              className="flex items-center gap-2 text-[13px] capitalize text-ink"
            >
              <input
                type="checkbox"
                name={`flag_${flag}`}
                defaultChecked={settings.feature_flags[flag] ?? true}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {flag}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Posts allowed per hour">
          <input
            name="post_per_hour"
            type="number"
            min={1}
            defaultValue={settings.rate_limits.post_per_hour ?? 10}
            className={input}
          />
        </Field>
        <Field label="Comments allowed per hour">
          <input
            name="comment_per_hour"
            type="number"
            min={1}
            defaultValue={settings.rate_limits.comment_per_hour ?? 60}
            className={input}
          />
        </Field>
      </div>

      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-[13px] text-positive">
          <CheckCircle2 size={15} /> Settings saved.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-[var(--radius)] bg-accent px-6 text-sm font-semibold text-on-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save general settings"}
      </button>
    </form>
  );
}

function CrisisForm({ initial }: { initial: CrisisResource[] }) {
  const [rows, setRows] = useState<CrisisResource[]>(
    initial.length > 0 ? initial : [{ name: "", detail: "", contact: "" }],
  );
  const [state, setState] = useState<State>({});
  const [pending, startTransition] = useTransition();

  function update(i: number, key: keyof CrisisResource, value: string) {
    setRows((r) => r.map((row, x) => (x === i ? { ...row, [key]: value } : row)));
  }

  function save() {
    setState({});
    const clean = rows.filter((r) => r.name.trim() && r.contact.trim());
    startTransition(async () => {
      const res = await updateCrisisResources(JSON.stringify(clean));
      setState(res.ok ? { ok: true } : { error: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">Crisis resources</h2>
        <p className="text-[13px] text-muted">
          Helplines shown on the Get help page and the crisis card.
        </p>
      </div>

      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row"
        >
          <input
            value={row.name}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder="Helpline name"
            className={input}
          />
          <input
            value={row.detail}
            onChange={(e) => update(i, "detail", e.target.value)}
            placeholder="Detail"
            className={input}
          />
          <input
            value={row.contact}
            onChange={(e) => update(i, "contact", e.target.value)}
            placeholder="Contact number"
            className={input}
          />
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, x) => x !== i))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius)] border border-border text-muted hover:text-danger"
          >
            <X size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows([...rows, { name: "", detail: "", contact: "" }])}
        className="flex items-center gap-1.5 self-start text-[13px] font-medium text-accent"
      >
        <Plus size={15} /> Add helpline
      </button>

      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-[13px] text-positive">
          <CheckCircle2 size={15} /> Crisis resources saved.
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="h-10 self-start rounded-[var(--radius)] bg-accent px-6 text-sm font-semibold text-on-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save crisis resources"}
      </button>
    </div>
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
