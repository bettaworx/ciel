"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api/use-api";

interface UsernameStepProps {
  onNext: (username: string) => void;
  initialValue?: string;
}

export function UsernameStep({ onNext, initialValue = "" }: UsernameStepProps) {
  const t = useTranslations();
  const api = useApi();
  const [username, setUsername] = useState(initialValue);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return;
    }

    // Clear previous error
    setError(null);
    setIsVerifying(true);

    try {
      // Check if user exists by fetching user profile
      const result = await api.userByUsername(trimmedUsername);

      if (result.ok) {
        // User exists, proceed to password step
        onNext(trimmedUsername);
      } else if (result.status === 404) {
        // User not found
        setError(t("login.wizard.username.notFound"));
      } else {
        // Other error
        setError(t("login.wizard.username.error"));
      }
    } catch (err) {
      // Network or other error
      setError(t("login.wizard.username.error"));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="login-username-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">
              {t("login.wizard.username.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("login.wizard.username.description")}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Clear error when user types
                if (error) setError(null);
              }}
              placeholder={t("username")}
              required
              autoFocus
              disabled={isVerifying}
              className="transition-colors duration-160 ease"
            />

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading message */}
            {isVerifying && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("login.wizard.username.checkingAvailability")}</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
