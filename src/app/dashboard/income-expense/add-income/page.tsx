import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AddIncomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="flex-1 p-8 pt-10 bg-background min-h-screen">
      <AddTransactionForm type="income" />
    </div>
  );
}
