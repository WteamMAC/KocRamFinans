import { redirect } from "next/navigation";

export default function AddIncomeRedirect() {
  redirect("/dashboard/income-expense/add?type=income");
}
