"use client";

import { useAtomValue } from "jotai";
import { userAtom, authStatusAtom } from "@/atoms/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api/use-api";
import { Loader2 } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { PageContainer } from "@/components/PageContainer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAtomValue(userAtom);
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();
  const api = useApi();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      // Wait for auth initialization to complete
      if (authStatus === "idle" || authStatus === "loading") {
        return;
      }

      // Auth is now ready or error
      if (user === null) {
        // Not authenticated
        router.replace("/login?redirect=/admin");
        return;
      }

      // Try to call an admin endpoint to check if user has admin access
      try {
        const result = await api.adminRoles();
        if (result.ok) {
          setHasAccess(true);
          setIsChecking(false);
        } else {
          // User doesn't have admin access
          router.replace("/");
        }
      } catch (error) {
        // Error checking access, redirect to home
        router.replace("/");
      }
    }

    checkAdminAccess();
  }, [user, authStatus, router, api]);

  if (isChecking || !hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="">
        <AdminNav />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
