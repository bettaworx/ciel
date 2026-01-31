"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createApiClient } from "@/lib/api/client";

const apiClient = createApiClient();

/**
 * SetupRedirect checks if server setup is completed
 * and redirects to /server-setup if not.
 * 
 * This component is added to the root layout and runs on every page.
 */
export function SetupRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if already on server setup page or login page
    if (pathname.startsWith("/server-setup") || pathname.startsWith("/login")) {
      return;
    }

    // Check if setup is completed
    apiClient.setupStatus().then((result) => {
      if (result.ok && !result.data.setupCompleted) {
        // Setup not completed, redirect to server setup
        router.push("/server-setup");
      }
    }).catch((error) => {
      // If the API call fails, don't redirect
      // This prevents infinite redirect loops if the backend is down
      console.error("Failed to check setup status:", error);
    });
  }, [pathname, router]);

  return null;
}
