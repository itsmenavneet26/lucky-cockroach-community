"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { areaIds, availabilityOptions } from "@/lib/volunteer";
import { fromZod, mapDbError, type FieldErrors } from "@/lib/errors";

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    // Strip formatting (spaces, dashes, parens) before validating; the
    // stored value is the cleaned form so contact attempts don't fail.
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^(\+?\d{10,15})$/,
          "Enter a valid phone number (10–15 digits, with optional country code).",
        ),
    ),
  location: z.string().trim().min(2, "Enter your city and state.").max(100),
  areas: z
    .array(z.enum(areaIds as [string, ...string[]]))
    .min(1, "Pick at least one way you'd like to contribute."),
  skills: z.string().trim().max(600).optional(),
  availability: z.enum(availabilityOptions as unknown as [string, ...string[]]),
  experience: z.string().trim().max(800).optional(),
  motivation: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least a sentence or two.")
    .max(800),
});

export type VolunteerState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: boolean;
};

export async function submitVolunteerApplication(
  _prev: VolunteerState,
  formData: FormData,
): Promise<VolunteerState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    areas: formData.getAll("areas"),
    skills: formData.get("skills") || undefined,
    availability: formData.get("availability"),
    experience: formData.get("experience") || undefined,
    motivation: formData.get("motivation"),
  });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Please sign in to apply." };

  const v = parsed.data;
  const { error } = await supabase.from("volunteer_applications").insert({
    user_id: userData.user.id,
    full_name: v.fullName,
    email: v.email,
    phone: v.phone,
    location: v.location,
    areas: v.areas,
    skills: v.skills ?? null,
    availability: v.availability,
    experience: v.experience ?? null,
    motivation: v.motivation,
  });

  if (error) {
    if (error.code === "23505") {
      // Surface clearly to the field so the user understands why the
      // form didn't accept their submission.
      return {
        error:
          "You've already submitted an application with this account. We'll be in touch soon.",
        fieldErrors: { email: "An application already exists for this account." },
      };
    }
    return { error: mapDbError("volunteer.insert", error).error };
  }
  return { success: true };
}
