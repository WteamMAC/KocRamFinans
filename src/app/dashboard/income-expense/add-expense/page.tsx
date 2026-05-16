import { redirect } from "next/navigation";

export default function AddExpenseRedirect() {
  redirect("/dashboard/income-expense/add?type=expense");
}
