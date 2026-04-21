import { z } from "zod";
import { t } from "@/core/i18n";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, t("auth.validation.emailRequired"))
    .email(t("auth.validation.emailInvalid")),
  password: z
    .string()
    .min(1, t("auth.validation.passwordRequired"))
    .min(6, t("auth.validation.passwordMinLength")),
});

export type LoginFormData = z.infer<typeof loginSchema>;
