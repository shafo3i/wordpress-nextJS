import "server-only";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessAdminPath } from "@/lib/admin-permissions";


export const isAuthenticated = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/cms-login");
    }

    return session;
};


export const verifyPostEditor = async () => {
    const session = await isAuthenticated();

    if ((session.user.role !== "admin" && session.user.role !== "editor") || session.user.banned) {
        redirect("/cms-admin");
    }

    return session;
};

/** Account and role administration is restricted to administrators. */
export const verifyAdmin = async () => {
    const session = await isAuthenticated();
    if (session.user.role !== "admin" || session.user.banned) {
        redirect(session.user.role === "editor" ? "/admincp/posts" : "/cms-admin");
    }
    return session;
};

/** Legacy callers are administrative modules. Editors opt into verifyPostEditor. has to be removed  */
export const verifyAdminOrEditor = verifyAdmin;

export const verifyAdminArea = async () => {
    const session = await verifyPostEditor();
    const pathname = (await headers()).get("x-cms-pathname") || "";
    if (!canAccessAdminPath(session.user.role, pathname)) redirect("/admincp/posts");
    return session;
};


