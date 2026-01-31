"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { validateUsername, validatePassword } from "@/lib/validation";

interface CreateAdminStepProps {
  onCreate: (username: string, password: string) => Promise<boolean>;
  loading?: boolean;
}

export function CreateAdminStep({
  onCreate,
  loading = false,
}: CreateAdminStepProps) {
  const t = useTranslations("adminSetup");
  const tCommon = useTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Validate both fields
    const validationErrors: string[] = [];
    
    const usernameErrorKey = validateUsername(username);
    if (usernameErrorKey) {
      validationErrors.push(tCommon(usernameErrorKey));
    }
    
    const passwordErrorKey = validatePassword(password);
    if (passwordErrorKey) {
      validationErrors.push(tCommon(passwordErrorKey));
    }
    
    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors and proceed
    setErrors([]);
    await onCreate(username.trim(), password);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="create-admin-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">{t("createAdmin.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("createAdmin.description")}
            </p>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {errors.length === 1 ? (
                  <p>{errors[0]}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("createAdmin.usernamePlaceholder")}
                disabled={loading}
                autoComplete="username"
                required
              />
              <p className="text-muted-foreground text-sm">
                {tCommon("validation.username.requirements")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("createAdmin.passwordPlaceholder")}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-sm">
                {tCommon("passwordRequirements")}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
