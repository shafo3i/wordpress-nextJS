import { AuthScreen, type AuthSearch } from "@/components/auth/auth-screen"

export default async function Page({ searchParams }: { searchParams: Promise<AuthSearch> }) {
  return <AuthScreen mode="login" accountType="user" search={await searchParams} />
}
