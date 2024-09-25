"use server";

import { readUserSession } from "@/lib/actions";
import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supabase";
import { revalidatePath, unstable_noStore } from "next/cache";

export async function createMember(data: {
	name: string;
	role: "admin" | "user";
	status: "active" | "resigned";
	email: string;
	password: string;
	confirm: string;
}) {
	const { data: userSession } = await readUserSession();
	if (userSession.session?.user.user_metadata.role !== 'admin')
		return JSON.stringify({ error: { message: "You don't have permission to create a member" } });

	const supabase = await createSupabaseAdmin();
	const createResult = await supabase.auth.admin.createUser({
		email: data.email, password: data.password,
		email_confirm: true,
		user_metadata: {
			role: data.role
		}
	});

	if (createResult.error?.message) return JSON.stringify(createResult);
	else {
		const memberResult = await supabase.from("member").insert({
			name: data.name, id: createResult.data.user?.id, email: data.email
		});
		if (memberResult.error?.message) return JSON.stringify(memberResult);
		else {
			const permissionResult = await supabase.from("permission").insert({
			role: data.role, member_id: createResult.data.user?.id, status: data.status
			});
			revalidatePath("/dashboard/member");
			return JSON.stringify(permissionResult);
		}
	}
}

//Update Basic Info
export async function updateMemberBasicById(id: string, data: {
    name: string;
}) {
	const supabase = await createSupabaseServerClient();
	const result = await supabase.from("member").update(data).eq("id", id);
	revalidatePath("/dashboard/member");
	return JSON.stringify(result);
}

//Update Advance Info
export async function updateMemberAdvanceById(permission_id: string, user_id: string, data: {
    role: "admin" | "user";
    status: "active" | "resigned";
}) {

	const { data: userSession } = await readUserSession();
	if (userSession.session?.user.user_metadata.role !== 'admin')
		return JSON.stringify({ error: { message: "You don't have permission to create a member" } });

	const supabaseAdmin = await createSupabaseAdmin();
	const updateResult = await supabaseAdmin.auth.admin.updateUserById(
		user_id,
		{ user_metadata: { role: data.role } }
	);
	if (updateResult.error?.message) return JSON.stringify(updateResult);
	else {
		const supabase = await createSupabaseServerClient();
		const result = await supabase.from("permission").update(data).eq("id", permission_id);
		revalidatePath("/dashboard/member");
		return JSON.stringify(result);
	}

}

export async function updateMemberAccountById(user_id: string, data: {
    email: string;
    password?: string | undefined;
    confirm?: string | undefined;
}) {

	const { data: userSession } = await readUserSession();
	if (userSession.session?.user.user_metadata.role !== 'admin')
		return JSON.stringify({ error: { message: "You don't have permission to create a member" } });

	
	
	let updateObject:{
    email: string;
    password?: string | undefined;
	} = { email: data.email };

	if(data.password ) updateObject["password"] = data.password;

	const supabaseAdmin = await createSupabaseAdmin();

	const updateResult = await supabaseAdmin.auth.admin.updateUserById(
		user_id,
		updateObject,
	);
	
	if (updateResult.error?.message) return JSON.stringify(updateResult);
	else {
		const supabase = await createSupabaseServerClient();
		const result = await supabase.from("member").update({ email: data.email }).eq("id", user_id);
		revalidatePath("/dashboard/member");
		return JSON.stringify(result);
	}

}



export async function deleteMemberById(user_id: string) {
	//Should be Admin
	const { data: userSession } = await readUserSession();
	if (userSession.session?.user.user_metadata.role !== 'admin')
		return JSON.stringify({ error: { message: "You don't have permission to create a member" } });

	//Delete in Supabase
	const supabaseAdmin = await createSupabaseAdmin();
	const deleteResult = await supabaseAdmin.auth.admin.deleteUser(user_id);

	if (deleteResult.error?.message) return JSON.stringify(deleteResult);
	else {
		const supabase = await createSupabaseServerClient();
		const result = await supabase.from("member").delete().eq("id", user_id);
		revalidatePath("/dashboard/member");
		return JSON.stringify(result);
	}
}




export async function readMembers() {
	unstable_noStore();
	const supabase = await createSupabaseServerClient();
	return await supabase.from("permission").select("*,member(*)");

}
