export type IPermission = {
    id: string;
    role: "admin" | "user";
    status: "active" | "resigned";
    member_id: string;
    member: {
        id: string;
        created_at: string;
        name: string;
        email: string;
    };
};