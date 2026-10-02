import { auth } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await auth.protect();
  const user = await syncCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
      <p className="text-sm text-muted-foreground">Authenticated workspace</p>
      <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">
        Your Clerk account is connected to your local profile.
      </p>
    </main>
  );
}
