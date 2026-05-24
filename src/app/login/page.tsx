import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getUser()) redirect(next || "/");

  return (
    <AuthLayout>
      <LoginForm next={next || "/"} />
    </AuthLayout>
  );
}
