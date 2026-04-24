import { z } from "zod";
import { t } from "@/core/i18n";

// --- Building blocks ---
/**
 * Shared email schema — reused across login, register, forgot-password,
 * magic-link forms.
 */
export const emailSchema = z
  .string()
  .min(1, t("auth.validation.emailRequired"))
  .email(t("auth.validation.emailInvalid"));

// --- Login ---
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, t("auth.validation.passwordRequired"))
    .min(6, t("auth.validation.passwordMinLength")),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// --- Register ---
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, t("auth.validation.fullNameRequired"))
      .min(2, t("auth.validation.fullNameMinLength"))
      .max(100, t("auth.validation.fullNameMaxLength")),
    email: emailSchema,
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(8, t("auth.validation.passwordMinLengthRegister")),
    confirmPassword: z
      .string()
      .min(1, t("auth.validation.confirmPasswordRequired")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordMismatch"),
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// --- Forgot Password ---
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// --- Reset Password ---
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(8, t("auth.validation.passwordMinLengthRegister")),
    confirmPassword: z
      .string()
      .min(1, t("auth.validation.confirmPasswordRequired")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordMismatch"),
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// --- Magic Link ---
export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

// --- LS API key (Commerce Phase 1) ---
export const lsApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, t("commerce.validation.apiKeyRequired"))
    .min(20, t("commerce.validation.apiKeyTooShort")),
  // .max dihapus — LS API key panjangnya tidak tentu
  isTestMode: z.boolean().optional().default(false),
});

/**
 * Zod `.default()` bikin input != output:
 *   - Input (what user types/useForm state holds): isTestMode optional
 *   - Output (what handleSubmit callback gets):    isTestMode guaranteed
 *
 * react-hook-form v7+ butuh tau dua-duanya — pass via 3-generic useForm:
 *   useForm<LSApiKeyInput, unknown, LSApiKeyFormData>(...)
 */
export type LSApiKeyInput = z.input<typeof lsApiKeySchema>;
export type LSApiKeyFormData = z.output<typeof lsApiKeySchema>;
