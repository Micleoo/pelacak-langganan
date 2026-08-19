"use client";

import { useParams } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  return <ExpenseForm expenseId={id} />;
}