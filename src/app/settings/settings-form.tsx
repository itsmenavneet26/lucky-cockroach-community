"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  AtSign,
  User as UserIcon,
  MapPin,
  ChevronDown,
  Check,
  X,
  FileText,
} from "lucide-react";
import { updateProfile, type SettingsState } from "./actions";
import { checkUsername } from "@/app/onboarding/actions";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const AVATAR_PRESETS: { seed: string; bg: string }[] = [
  { seed: "saffron", bg: "fbbf24" },
  { seed: "ember", bg: "fb923c" },
  { seed: "monsoon", bg: "60a5fa" },
  { seed: "tulsi", bg: "34d399" },
  { seed: "marigold", bg: "f59e0b" },
  { seed: "kesar", bg: "f472b6" },
  { seed: "horizon", bg: "a78bfa" },
  { seed: "cinder", bg: "14b8a6" },
];
const presetUrl = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands",
  "Chandigarh","Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

const STATUS_OPTIONS = [
  "Student",
  "Govt exam aspirant",
  "Working professional",
  "Between jobs",
  "Parent / family member",
  "Supporter / ally",
  "Other",
];

const INTEREST_OPTIONS = [
  "Paper leaks & exam fraud",
  "Recruitment delays",
  "Unemployment",
  "Mental health",
  "Aspirant life",
  "Scholarships",
  "Mentorship",
  "Activism & policy",
];

/** Split "City, State" into [city, state]. Falls back if no comma. */
function splitLocation(loc: string): { city: string; state: string } {
  if (!loc) return { city: "", state: "" };
  const parts = loc.split(",").map((s) => s.trim());
  if (parts.length >= 2 && INDIAN_STATES.includes(parts[parts.length - 1])) {
    return {
      state: parts[parts.length - 1],
      city: parts.slice(0, -1).join(", "),
    };
  }
  return { city: loc, state: "" };
}

export function SettingsForm({
  userId,
  username,
  displayName,
  bio,
  avatarUrl,
  pronouns,
  location,
  status,
  interests,
}: {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  pronouns: string;
  location: string;
  status: string;
  interests: string[];
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateProfile,
    {},
  );

  const initialLoc = splitLocation(location);
  const knownStatus = STATUS_OPTIONS.includes(status);

  const [usernameValue, setUsernameValue] = useState(username);
  const [name, setName] = useState(displayName);
  const [bioValue, setBioValue] = useState(bio);
  const [pronounsValue, setPronounsValue] = useState(pronouns);
  const [stateValue, setStateValue] = useState(initialLoc.state);
  const [city, setCity] = useState(initialLoc.city);
  const [statusSelected, setStatusSelected] = useState(
    status ? (knownStatus ? status : "Other") : "",
  );
  const [statusOther, setStatusOther] = useState(
    status && !knownStatus ? status : "",
  );
  const [interestsValue, setInterestsValue] = useState<string[]>(interests);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");

  // Debounced live username availability check — same UX as onboarding.
  useEffect(() => {
    if (usernameValue === username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const res = await checkUsername(usernameValue);
      if (!res.ok) setUsernameStatus("invalid");
      else setUsernameStatus(res.available ? "ok" : "taken");
    }, 350);
    return () => clearTimeout(t);
  }, [usernameValue, username]);

  const locationValue = [city.trim(), stateValue].filter(Boolean).join(", ");
  const statusFinal =
    statusSelected === "Other" ? statusOther.trim() : statusSelected;

  function toggleInterest(value: string) {
    setInterestsValue((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : prev.length < 5
          ? [...prev, value]
          : prev,
    );
  }

  async function uploadAvatar(file: File) {
    setUploadError("");
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("That image is too large (max 5MB).");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      // Map known Supabase storage errors to actionable messages.
      const msg = error.message || "";
      if (/payload too large|file size|too large/i.test(msg)) {
        setUploadError("That image is too large (max 5MB).");
      } else if (/not allowed|denied|unauthor/i.test(msg)) {
        setUploadError("You don't have permission to upload right now.");
      } else if (/quota|limit/i.test(msg)) {
        setUploadError("Upload quota reached. Please try again later.");
      } else {
        setUploadError("Upload failed. Check your connection and try again.");
      }
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setAvatar(data.publicUrl);
    setUploading(false);
  }

  return (
    <form
      action={action}
      className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft sm:p-6"
    >
      <input type="hidden" name="avatarUrl" value={avatar} />
      <input type="hidden" name="location" value={locationValue} />
      <input type="hidden" name="status" value={statusFinal} />
      {interestsValue.map((i) => (
        <input key={i} type="hidden" name="interests" value={i} />
      ))}

      {/* Avatar block */}
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <Avatar src="" name={name || usernameValue} size={80} />
            )}
          </span>
          <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-accent text-on-accent ring-2 ring-surface">
            {uploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
        </label>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">Profile photo</p>
          <p className="text-[12px] text-muted">
            Click the avatar to upload, or pick one below.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AVATAR_PRESETS.map(({ seed, bg }) => {
              const url = presetUrl(seed, bg);
              const selected = avatar === url;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setAvatar(url)}
                  aria-label={`Avatar ${seed}`}
                  className={cn(
                    "h-7 w-7 overflow-hidden rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110",
                    selected
                      ? "ring-2 ring-accent"
                      : "ring-1 ring-border hover:ring-accent/60",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full" />
                </button>
              );
            })}
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar("")}
                className="flex h-7 items-center gap-1 rounded-full border border-border px-2 text-[11px] font-medium text-muted hover:border-danger hover:text-danger"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Username">
          <div
            className={cn(
              "flex h-11 items-center rounded-[var(--radius)] border bg-surface-2 focus-within:border-accent",
              state.fieldErrors?.username || usernameStatus === "taken"
                ? "border-danger"
                : "border-border",
            )}
          >
            <AtSign size={15} className="ml-3 text-muted" />
            <input
              name="username"
              value={usernameValue}
              onChange={(e) =>
                setUsernameValue(e.target.value.toLowerCase().slice(0, 20))
              }
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              aria-invalid={
                Boolean(state.fieldErrors?.username) ||
                usernameStatus === "taken"
              }
              className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
            />
            {usernameStatus === "checking" && (
              <Loader2 size={13} className="mr-3 animate-spin text-muted" />
            )}
            {usernameStatus === "ok" && (
              <Check size={13} className="mr-3 text-positive" />
            )}
          </div>
          {(state.fieldErrors?.username || usernameStatus === "taken") && (
            <p className="mt-1 text-[12px] text-danger">
              {state.fieldErrors?.username ?? "That username is taken."}
            </p>
          )}
        </Field>
        <Field label="Display name">
          <div className="flex h-11 items-center rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
            <UserIcon size={15} className="ml-3 text-muted" />
            <input
              name="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
            />
          </div>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Pronouns">
          <input
            name="pronouns"
            value={pronounsValue}
            onChange={(e) => setPronounsValue(e.target.value)}
            maxLength={30}
            placeholder="e.g. she/her"
            className="h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>
        <Field label="State">
          <SelectField
            value={stateValue}
            onChange={setStateValue}
            placeholder="Choose state…"
            options={INDIAN_STATES}
            allowClear
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="City">
          <div className="flex h-11 items-center rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
            <MapPin size={15} className="ml-3 text-muted" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
              placeholder="e.g. Jaipur"
              className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
            />
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="What brings you here?">
          <SelectField
            value={statusSelected}
            onChange={setStatusSelected}
            placeholder="Choose what fits best…"
            options={STATUS_OPTIONS}
            allowClear
          />
          {statusSelected === "Other" && (
            <input
              value={statusOther}
              onChange={(e) => setStatusOther(e.target.value)}
              maxLength={40}
              placeholder="Tell us in a few words…"
              className="mt-2 h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-accent"
            />
          )}
        </Field>
      </div>

      <div className="mt-4">
        <Field label="What do you care about?">
          <MultiSelectField
            options={INTEREST_OPTIONS}
            selected={interestsValue}
            onToggle={toggleInterest}
            placeholder="Pick a few…"
            max={5}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Bio">
          <div className="flex items-start rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
            <FileText size={15} className="ml-3 mt-3 shrink-0 text-muted" />
            <textarea
              name="bio"
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Tell the community a little about yourself."
              className="w-full resize-none bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
        </Field>
      </div>

      {uploadError && (
        <p className="mt-4 text-[13px] text-danger">{uploadError}</p>
      )}
      {state.error && (
        <p className="mt-4 text-[13px] text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-4 flex items-center gap-1.5 text-[13px] text-positive">
          <CheckCircle2 size={15} /> Profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          uploading ||
          usernameStatus === "checking" ||
          usernameStatus === "taken"
        }
        className="mt-5 flex h-10 items-center justify-center rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light px-6 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
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
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  allowClear,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  allowClear?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-[var(--radius)] border border-border bg-surface-2 px-3 pr-9 text-sm text-ink outline-none focus:border-accent"
      >
        <option value="">{allowClear ? "— none —" : placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

function MultiSelectField({
  options,
  selected,
  onToggle,
  placeholder,
  max,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  max: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-left text-sm text-ink outline-none focus:border-accent"
      >
        <span className={cn("truncate", selected.length === 0 && "text-muted")}>
          {selected.length === 0
            ? placeholder
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "ml-2 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {selected.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
            >
              {s}
              <button
                type="button"
                onClick={() => onToggle(s)}
                aria-label={`Remove ${s}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-[12px] font-semibold text-ink-soft">
              {selected.length} / {max} selected
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = selected.includes(opt);
              const disabled = !isSelected && selected.length >= max;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(opt)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px]",
                      isSelected
                        ? "bg-accent-soft text-accent"
                        : "text-ink hover:bg-surface-2",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded border",
                        isSelected
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border-strong",
                      )}
                    >
                      {isSelected && <Check size={11} />}
                    </span>
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end border-t border-border p-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 rounded-full bg-accent px-4 text-[12px] font-semibold text-on-accent hover:bg-accent-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
