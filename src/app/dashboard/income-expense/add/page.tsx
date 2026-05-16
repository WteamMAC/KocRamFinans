import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function AddTransactionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 bg-background/50 min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      }>
        <AddTransactionForm />
      </Suspense>
    </div>
  );
}
