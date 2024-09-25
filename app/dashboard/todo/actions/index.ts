"use server";

import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supabase";
import { revalidatePath, unstable_noStore } from "next/cache";

export async function createTodo(data: {
    title: string;
    completed: boolean;
}) {
	    const supabase = await createSupabaseAdmin();
		const todoResult = await supabase.from("todo").insert({
			title: data.title, completed: data.completed
		});
		if (todoResult.error?.message) return JSON.stringify(todoResult);
		else {
			revalidatePath("/dashboard/todo");
			return JSON.stringify(todoResult);
		}
	
}
export async function updateTodoById(id: string) {
	console.log("update todo");
}
export async function deleteTodoById(id: string) {}
export async function readTodos() {
	const supabase = await createSupabaseServerClient();
	return await supabase.from("todo").select("*");
}
