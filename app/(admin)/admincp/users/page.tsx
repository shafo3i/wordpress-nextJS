import { Metadata } from "next";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getUsers, getUsersCounts, getAvailableRoles } from "./query";
import { UserTable } from "./_components";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langContext = await getAdminLanguageContext();
  const title = langContext.dict["admin.menu.users"] || "Users";
  return {
    title: `${title} — CMS`,
    description: "Manage system accounts, user permissions, and security roles.",
  };
}

type PageProps = {
  searchParams?: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await verifyAdminOrEditor();
  const langContext = await getAdminLanguageContext();
  const { dict, direction } = langContext;

  const resolvedParams = searchParams ? await searchParams : {};
  const page = Number(resolvedParams?.page) || 1;
  const search = resolvedParams?.search?.trim() || "";
  const role = resolvedParams?.role?.trim() || "all";
  const pageSize = 20;

  const [{ users, total, pages, currentPage }, counts, roles] = await Promise.all([
    getUsers({
      page,
      limit: pageSize,
      search: search || undefined,
      role: role !== "all" ? role : undefined,
    }),
    getUsersCounts(),
    getAvailableRoles(),
  ]);

  return (
    <AdminShell>
      <UserTable
        users={users}
        counts={counts}
        roles={roles}
        totalItems={total}
        currentPage={currentPage}
        totalPages={pages}
        pageSize={pageSize}
        searchQuery={search}
        currentRole={role}
        currentUserId={session.user.id}
        direction={direction as "rtl" | "ltr"}
        dict={dict}
      />
    </AdminShell>
  );
}
