import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AddExpensePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="flex-1 p-8 pt-10 bg-[#f8f9fa] min-h-screen">
      <AddTransactionForm type="expense" />
    </div>
  );
}
