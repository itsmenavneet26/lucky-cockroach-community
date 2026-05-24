"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Camera,
  Loader2,
  ArrowRight,
  AtSign,
  Check,
  X,
  User as UserIcon,
  FileText,
  ShieldCheck,
  Plus,
  MapPin,
  ChevronDown,
} from "lucide-react";
import {
  completeOnboarding,
  checkUsername,
  type OnboardingState,
} from "./actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Colorful preset avatars — varied vibrant backgrounds. */
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
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
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

export function OnboardingForm({
  userId,
  defaultUsername,
  defaultName,
  defaultAvatar,
  next,
}: {
  userId: string;
  defaultUsername: string;
  defaultName: string;
  defaultAvatar: string;
  next: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );
  const [username, setUsername] = useState(defaultUsername);
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [name, setName] = useState(defaultName);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [statusSelected, setStatusSelected] = useState("");
  const [statusOther, setStatusOther] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [, startCheck] = useTransition();

  const location = [city.trim(), stateValue].filter(Boolean).join(", ");
  const statusValue =
    statusSelected === "Other" ? statusOther.trim() : statusSelected;

  useEffect(() => {
    if (!username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = setTimeout(() => {
      startCheck(async () => {
        const res = await checkUsername(username);
        if (!res.ok) setUsernameState("invalid");
        else setUsernameState(res.available ? "available" : "taken");
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [username]);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : prev.length < 5
          ? [...prev, value]
          : prev,
    );
  }

  async function uploadAvatar(file: File) {
    setUploadError("");
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: false });
    if (error) {
      setUploadError("Upload failed. Try a smaller image (max 5MB).");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setAvatar(data.publicUrl);
    setUploading(false);
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="avatarUrl" value={avatar} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="status" value={statusValue} />
      {interests.map((i) => (
        <input key={i} type="hidden" name="interests" value={i} />
      ))}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera size={26} />
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
          <p className="text-[15px] font-semibold text-ink">Add a photo</p>
          <p className="text-[12px] text-muted">
            Click the avatar to upload — or pick one below.
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
          </div>
          {uploadError && (
            <p className="mt-1 text-[12px] text-danger">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Username + Display name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Username"
          hint={
            usernameState === "taken"
              ? "Already taken."
              : usernameState === "invalid"
                ? "3–20 lowercase letters, numbers, underscores."
                : "Lowercase, no spaces."
          }
          hintTone={
            usernameState === "taken" || usernameState === "invalid"
              ? "error"
              : "muted"
          }
        >
          <div
            className={cn(
              "flex h-11 items-center rounded-[var(--radius)] border bg-surface-2 focus-within:border-accent",
              usernameState === "available"
                ? "border-positive/60"
                : usernameState === "taken" || usernameState === "invalid"
                  ? "border-danger/60"
                  : "border-border",
            )}
          >
            <AtSign size={15} className="ml-3 text-muted" />
            <input
              name="username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().slice(0, 20))
              }
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
            />
            <span className="mr-3 flex h-5 w-5 items-center justify-center">
              {usernameState === "checking" && (
                <Loader2 size={14} className="animate-spin text-muted" />
              )}
              {usernameState === "available" && (
                <Check size={15} className="text-positive" />
              )}
              {(usernameState === "taken" || usernameState === "invalid") && (
                <X size={15} className="text-danger" />
              )}
            </span>
          </div>
        </Field>

        <Field label="Display name" hint="Shown on your posts and replies.">
          <div className="flex h-11 items-center rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
            <UserIcon size={15} className="ml-3 text-muted" />
            <input
              name="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
            />
          </div>
        </Field>
      </div>

      {/* Pronouns */}
      <Field label="Pronouns" hint="Optional — e.g. she/her, he/him, they/them.">
        <div className="flex h-11 items-center rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
          <UserIcon size={15} className="ml-3 text-muted" />
          <input
            name="pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            maxLength={30}
            placeholder="e.g. she/her"
            className="h-full w-full bg-transparent px-2 text-sm text-ink outline-none"
          />
        </div>
      </Field>

      {/* State + City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State" hint="Optional — pick from the list.">
          <SelectField
            value={stateValue}
            onChange={setStateValue}
            placeholder="Choose state…"
            options={INDIAN_STATES}
          />
        </Field>
        <Field label="City" hint="Optional — your city or town.">
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

      {/* Status with "Other" reveal */}
      <Field label="What brings you here?" hint="Helps us welcome you the right way.">
        <SelectField
          value={statusSelected}
          onChange={setStatusSelected}
          placeholder="Choose what fits best…"
          options={STATUS_OPTIONS}
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

      {/* Interests — multi-select dropdown */}
      <Field
        label="What do you care about?"
        hint={
          interests.length >= 5
            ? "5 / 5 — maxed out."
            : `Pick up to 5 — helps us match you. (${interests.length}/5)`
        }
      >
        <MultiSelectField
          options={INTEREST_OPTIONS}
          selected={interests}
          onToggle={toggleInterest}
          placeholder="Pick a few…"
          max={5}
        />
      </Field>

      {/* Bio */}
      <Field label="Short bio" hint="Optional — what brought you here, in a line or two.">
        <div className="flex items-start rounded-[var(--radius)] border border-border bg-surface-2 focus-within:border-accent">
          <FileText size={15} className="ml-3 mt-3 shrink-0 text-muted" />
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="e.g. NEET aspirant from Jaipur, on my second attempt."
            className="w-full resize-none bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
      </Field>

      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[12px] text-muted">
          <ShieldCheck size={13} />
          Your information is secure.
        </p>
        <button
          type="submit"
          disabled={pending || uploading || usernameState === "taken"}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-light px-7 font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Continue"}
          {!pending && <ArrowRight size={17} />}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  hintTone = "muted",
  children,
}: {
  label: string;
  hint: string;
  hintTone?: "muted" | "error";
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      <span
        className={cn(
          "text-[11px] leading-snug",
          hintTone === "error" ? "text-danger" : "text-muted",
        )}
      >
        {hint}
      </span>
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-[var(--radius)] border border-border bg-surface-2 px-3 pr-9 text-sm text-ink outline-none focus:border-accent"
      >
        <option value="" disabled>
          {placeholder}
        </option>
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
