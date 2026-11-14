import "server-only";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessAdminPath } from "@/lib/admin-permissions";


// Next returns the same headers object within a request. Share only its session
// lookup, including concurrent guards, rather than opening another DB connection
// while a protected content transaction is already holding one. Weak keys keep
// this cache request-scoped; equal cookie values in another request never reuse it.
const requestSessions = new WeakMap<object, ReturnType<typeof auth.api.getSession>>();

export const isAuthenticated = async () => {
    const requestHeaders = await headers();
    let pending = requestSessions.get(requestHeaders);
    if (!pending) {
        pending = auth.api.getSession({ headers: requestHeaders });
        requestSessions.set(requestHeaders, pending);
    }
    const session = await pending;

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


