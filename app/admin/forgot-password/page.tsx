import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function AdminForgotPasswordPage() {
  return (
    <main className="orduva-admin-refresh min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(51,102,153,0.10),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.05),transparent_30%),linear-gradient(135deg,#F6F8F7_0%,#F1F5F4_48%,#FFFFFF_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <ForgotPasswordForm scope="tenant_admin" />
      </div>
    </main>
  );
}
