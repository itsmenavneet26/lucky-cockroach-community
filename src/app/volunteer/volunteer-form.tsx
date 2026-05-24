"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CheckCircle2, Check } from "lucide-react";
import {
  submitVolunteerApplication,
  type VolunteerState,
} from "./actions";
import { contributionAreas, availabilityOptions } from "@/lib/volunteer";
import { cn } from "@/lib/utils";

export function VolunteerForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState<VolunteerState, FormData>(
    submitVolunteerApplication,
    {},
  );
  const [areas, setAreas] = useState<string[]>([]);

  function toggleArea(id: string) {
    setAreas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (state.success) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 size={30} />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          Thank you for stepping up
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft">
          Your application has been received. Our team will review it and reach
          out to you over email or phone. Every pair of hands matters — welcome
          to the groundwork.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          Back to the community
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft sm:p-7"
    >
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        Volunteer application
      </h2>
      <p className="mt-1 text-[13px] text-ink-soft">
        Fill this in honestly — there are no wrong answers, only willing hands.
      </p>

      {/* hidden area inputs */}
      {areas.map((id) => (
        <input key={id} type="hidden" name="areas" value={id} />
      ))}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            name="fullName"
            defaultValue={defaultName}
            required
            className={inputCls}
            placeholder="Your full name"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={defaultEmail}
            required
            className={inputCls}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone / WhatsApp">
          <input
            name="phone"
            type="tel"
            required
            className={inputCls}
            placeholder="+91 XXXXX XXXXX"
          />
        </Field>
        <Field label="City & State">
          <input
            name="location"
            required
            className={inputCls}
            placeholder="e.g. Jaipur, Rajasthan"
          />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-[13px] font-semibold text-ink">
          How would you like to contribute?
        </p>
        <p className="text-[12px] text-muted">Select all that apply.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {contributionAreas.map((area) => {
            const selected = areas.includes(area.id);
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => toggleArea(area.id)}
                className={cn(
                  "flex items-start gap-2.5 rounded-[var(--radius)] border p-3 text-left",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface-2 hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border",
                    selected
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border-strong",
                  )}
                >
                  {selected && <Check size={13} />}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-ink">
                    {area.name}
                  </span>
                  <span className="block text-[12px] leading-snug text-ink-soft">
                    {area.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <Field label="Your specific skills (optional)">
          <textarea
            name="skills"
            rows={2}
            maxLength={600}
            className={inputCls}
            placeholder="e.g. Premiere Pro editing, content writing in Hindi, B.Ed qualified, MSW counselling…"
          />
        </Field>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-[13px] font-semibold text-ink">
          How much time can you give?
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {availabilityOptions.map((opt, i) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-ink has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
            >
              <input
                type="radio"
                name="availability"
                value={opt}
                defaultChecked={i === 0}
                className="accent-[var(--accent)]"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Field label="Relevant experience (optional)">
          <textarea
            name="experience"
            rows={3}
            maxLength={800}
            className={inputCls}
            placeholder="Any past volunteering, organising, teaching, or related work."
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Why do you want to volunteer?">
          <textarea
            name="motivation"
            rows={4}
            required
            maxLength={800}
            className={inputCls}
            placeholder="Tell us what brings you to the movement and what you hope to give."
          />
        </Field>
      </div>

      {state.error && (
        <p className="mt-4 text-[13px] text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {children}
    </label>
  );
}
