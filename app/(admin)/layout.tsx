import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toast"

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await verifyAdminOrEditor();
    return (
        <ThemeProvider attribute="class">
            <div className="min-h-svh">
                {session.user ? children : <p>Please log in</p>}
            </div>
            <Toaster />
        </ThemeProvider>
    );
}