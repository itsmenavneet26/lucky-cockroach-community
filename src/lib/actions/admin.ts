"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  forbidden,
  fromZod,
  mapDbError,
  ok,
  type ActionResult,
} from "@/lib/errors";

type Result = ActionResult;

/** Confirm the caller is an admin; returns the admin's id or null. */
async function requireAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) {
    console.error("[admin] requireAdminId profile lookup:", error.message);
    return null;
  }
  return data?.role === "admin" ? userData.user.id : null;
}

async function audit(
  actorId: string,
  action: string,
  meta: Record<string, unknown> = {},
) {
  const { error } = await createServiceClient()
    .from("mod_audit_log")
    .insert({ actor_id: actorId, action, target_type: "admin", meta });
  if (error) {
    // Audit failures shouldn't fail the user-facing action, but they
    // must be visible in server logs.
    console.error("[admin] audit insert:", action, error.message);
  }
}

/** Local convenience — defers to mapDbError, prefixes scope with [admin]. */
function fail(
  scope: string,
  error: { message: string; code?: string },
  overrides?: Partial<
    Record<string, { code: "validation" | "conflict" | "forbidden" | "not_found" | "server"; message: string }>
  >,
): Result {
  return mapDbError(`admin.${scope}`, error, overrides);
}

// ── TOPICS ───────────────────────────────────────────────────
export async function createTopic(formData: FormData): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (name.length < 3)
    return {
      ok: false,
      code: "validation",
      error: "Topic name must be at least 3 characters.",
      fieldErrors: { name: "Too short." },
    };

  const slug = slugify(name);
  const service = createServiceClient();
  const { error } = await service.from("topics").insert({
    slug,
    name,
    description: description || null,
    created_by: admin,
    sort_order: 100,
  });
  if (error)
    return fail("createTopic", error, {
      "23505": {
        code: "conflict",
        message: "A topic with a similar name already exists.",
      },
    });
  await audit(admin, "topic_created", { slug, name });
  revalidatePath("/admin/topics");
  revalidatePath("/explore");
  updateTag("topics");
  return ok();
}

export async function updateTopic(formData: FormData): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const rules = String(formData.get("rules") || "").trim();
  if (!id || name.length < 3)
    return {
      ok: false,
      code: "validation",
      error: "Topic name must be at least 3 characters.",
      fieldErrors: !id ? { id: "Missing topic id." } : { name: "Too short." },
    };

  const { error } = await createServiceClient()
    .from("topics")
    .update({ name, description: description || null, rules: rules || null })
    .eq("id", id);
  if (error) return fail("updateTopic", error);
  await audit(admin, "topic_updated", { id, name });
  revalidatePath("/admin/topics");
  revalidatePath("/explore");
  updateTag("topics");
  return ok();
}

export async function toggleTopicArchive(
  id: string,
  archived: boolean,
): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");
  const { error } = await createServiceClient()
    .from("topics")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) return fail("toggleTopicArchive", error);
  await audit(admin, archived ? "topic_archived" : "topic_restored", { id });
  revalidatePath("/admin/topics");
  revalidatePath("/explore");
  updateTag("topics");
  return ok();
}

// ── USERS ────────────────────────────────────────────────────
export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");
  if (userId === admin)
    return forbidden("You can't change your own role.");
  const { error } = await createServiceClient()
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return fail("setUserRole", error);
  await audit(admin, "role_changed", { userId, role });
  revalidatePath("/admin/users");
  return ok();
}

// ── VOLUNTEERS ───────────────────────────────────────────────
export async function setVolunteerStatus(
  applicationId: string,
  status: "pending" | "reviewing" | "accepted" | "declined",
): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");
  const { error } = await createServiceClient()
    .from("volunteer_applications")
    .update({
      status,
      reviewed_by: admin,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (error) return fail("setVolunteerStatus", error);
  await audit(admin, "volunteer_status", { applicationId, status });
  revalidatePath("/admin/volunteers");
  return ok();
}

// ── APPEARANCE (announcement + hero banners) ─────────────────
const heroSchema = z.object({
  heading: z.string().trim().max(200),
  text: z.string().trim().max(500),
  image: z.string().trim().url().or(z.literal("")),
});

export async function updateAppearance(formData: FormData): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");

  const announcement = {
    enabled: formData.get("ann_enabled") === "on",
    text: String(formData.get("ann_text") || "").trim().slice(0, 300),
    href: String(formData.get("ann_href") || "").trim(),
    image: String(formData.get("ann_image") || "").trim(),
  };

  const homeHeroParsed = heroSchema.safeParse({
    heading: formData.get("home_heading"),
    text: formData.get("home_text"),
    image: formData.get("home_image") || "",
  });
  const volHeroParsed = heroSchema.safeParse({
    heading: formData.get("vol_heading"),
    text: formData.get("vol_text"),
    image: formData.get("vol_image") || "",
  });
  if (!homeHeroParsed.success) return fromZod(homeHeroParsed.error);
  if (!volHeroParsed.success) return fromZod(volHeroParsed.error);

  const home_hero = {
    ...homeHeroParsed.data,
    cta_label: String(formData.get("home_cta_label") || "Learn more").trim(),
    cta_href: String(formData.get("home_cta_href") || "/about").trim(),
  };
  const volunteer_hero = volHeroParsed.data;

  const { error } = await createServiceClient()
    .from("site_settings")
    .update({
      announcement,
      home_hero,
      volunteer_hero,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return fail("updateAppearance", error);
  await audit(admin, "appearance_updated");
  revalidatePath("/", "layout");
  updateTag("settings");
  return ok();
}

// ── GENERAL SETTINGS ─────────────────────────────────────────
export async function updateGeneralSettings(
  formData: FormData,
): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");

  const site_name = String(formData.get("site_name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const registration_open = formData.get("registration_open") === "on";
  const feature_flags = {
    polls: formData.get("flag_polls") === "on",
    images: formData.get("flag_images") === "on",
    links: formData.get("flag_links") === "on",
  };
  const rate_limits = {
    post_per_hour: Math.max(1, Number(formData.get("post_per_hour")) || 10),
    comment_per_hour: Math.max(1, Number(formData.get("comment_per_hour")) || 60),
  };

  if (site_name.length < 2)
    return {
      ok: false,
      code: "validation",
      error: "Site name is required.",
      fieldErrors: { site_name: "Required." },
    };

  const { error } = await createServiceClient()
    .from("site_settings")
    .update({
      site_name,
      tagline,
      registration_open,
      feature_flags,
      rate_limits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return fail("updateGeneralSettings", error);
  await audit(admin, "settings_updated");
  revalidatePath("/", "layout");
  updateTag("settings");
  return ok();
}

// ── CRISIS RESOURCES ─────────────────────────────────────────
const crisisSchema = z.array(
  z.object({
    name: z.string().trim().min(1).max(120),
    detail: z.string().trim().max(200),
    contact: z.string().trim().min(1).max(120),
  }),
);

export async function updateCrisisResources(json: string): Promise<Result> {
  const admin = await requireAdminId();
  if (!admin) return forbidden("Only admins can do that.");
  let parsed;
  try {
    parsed = crisisSchema.parse(JSON.parse(json));
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as z.ZodError);
    }
    return {
      ok: false,
      code: "validation",
      error: "Crisis resources are not valid JSON.",
    };
  }
  const { error } = await createServiceClient()
    .from("site_settings")
    .update({ crisis_resources: parsed, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return fail("updateCrisisResources", error);
  await audit(admin, "crisis_resources_updated");
  revalidatePath("/", "layout");
  updateTag("settings");
  return ok();
}
