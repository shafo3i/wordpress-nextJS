import { verifyAdminArea } from "@/lib/authMIddleware";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toast"
import TanStackProvider from "@/components/providers/tanstack-provider"


export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await verifyAdminArea();
    return (
        <ThemeProvider attribute="class">
            <TanStackProvider>
                <div className="min-h-svh">
                    {session.user ? children : <p>Please log in</p>}
                </div>
            </TanStackProvider>
            <Toaster />
        </ThemeProvider>
    );
}
