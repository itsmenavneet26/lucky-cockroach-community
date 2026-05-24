import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getUser()) redirect(next || "/");

  return (
    <AuthLayout>
      <SignupForm next={next || "/"} />
    </AuthLayout>
  );
}
