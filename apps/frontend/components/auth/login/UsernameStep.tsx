"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const autofillAttemptedRef = useRef(false);

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

  useEffect(() => {
    if (initialValue || autofillAttemptedRef.current) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    const syncAutofilledValue = () => {
      const autofilledUsername = input.value.trim();

      if (!autofilledUsername || autofillAttemptedRef.current || isVerifying) {
        return;
      }

      autofillAttemptedRef.current = true;
      setUsername(autofilledUsername);
      setError(null);
      void (async () => {
        setIsVerifying(true);

        try {
          const result = await api.userByUsername(autofilledUsername);

          if (result.ok) {
            onNext(autofilledUsername);
          } else if (result.status === 404) {
            setError(t("login.wizard.username.notFound"));
          } else {
            setError(t("login.wizard.username.error"));
          }
        } catch {
          setError(t("login.wizard.username.error"));
        } finally {
          setIsVerifying(false);
        }
      })();
    };

    const animationFrameId = window.requestAnimationFrame(syncAutofilledValue);
    const timeoutId = window.setTimeout(syncAutofilledValue, 300);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [api, initialValue, isVerifying, onNext, t]);

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
          </div>

          <div className="space-y-4">
            <Input
              id="username"
              type="text"
              ref={inputRef}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Clear error when user types
                if (error) setError(null);
              }}
              placeholder={t("username")}
              required
              autoFocus
              autoComplete="username"
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
                <Spinner size="xs" />
                <span>{t("login.wizard.username.checkingAvailability")}</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
