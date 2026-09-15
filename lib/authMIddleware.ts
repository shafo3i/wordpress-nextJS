import { headers } from "next/headers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";


export const isAuthenticated = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/cms-login");
    }

    return session;
};

export const verifyAdminOrEditor = async () => {
    const session = await isAuthenticated();

    if (session.user.role !== "admin" && session.user.role !== "editor") {
        redirect("/cms-admin");
    }

    return session;
};


