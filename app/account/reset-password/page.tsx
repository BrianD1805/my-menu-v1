import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function CustomerResetPasswordPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = searchParams ? await searchParams : {};
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 sm:px-5 lg:px-6">
      <ResetPasswordForm defaultToken={params?.token || ""} loginHref="/account/login" />
    </main>
  );
}
