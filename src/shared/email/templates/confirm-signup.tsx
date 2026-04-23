/**
 * Email: Confirm Signup.
 *
 * Dikirim setelah user register dengan email+password, kalau
 * `requireEmailVerification: true` di app config (match dengan Supabase
 * dashboard: Auth → Providers → Email → Confirm email).
 *
 * NOTE: Kalau boilerplate jalan dengan `requireEmailVerification: false`
 * (default kamu saat ini), template ini cuma dipake untuk flow invite.
 */

import { Text } from "@react-email/components";
import { EmailLayout, PrimaryButton } from "./_layout";
import { brandingConfig } from "@/config";

export interface ConfirmSignupEmailProps {
  confirmUrl: string;
  token: string;
  userName?: string;
}

export function ConfirmSignupEmail({
  confirmUrl,
  token,
  userName,
}: ConfirmSignupEmailProps) {
  const greeting = userName ? `Hai ${userName},` : "Hai,";

  return (
    <EmailLayout preview={`Konfirmasi email kamu untuk ${brandingConfig.name}`}>
      <Text className="m-0 mb-4 text-base leading-relaxed text-gray-900">
        {greeting}
      </Text>

      <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
        Terima kasih sudah daftar di {brandingConfig.name}. Untuk menyelesaikan
        pendaftaran dan mengamankan akun kamu, klik tombol di bawah ini untuk
        mengonfirmasi alamat email.
      </Text>

      <div style={{ margin: "24px 0" }}>
        <PrimaryButton href={confirmUrl}>Konfirmasi Email</PrimaryButton>
      </div>

      <Text className="m-0 mb-2 text-sm leading-relaxed text-gray-600">
        Tombol tidak bekerja? Salin dan tempel tautan ini ke browser kamu:
      </Text>
      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-900 break-all">
        {confirmUrl}
      </Text>

      <Text className="m-0 text-sm leading-relaxed text-gray-600">
        Atau gunakan kode verifikasi ini jika diminta:{" "}
        <span className="font-mono font-semibold text-gray-900">{token}</span>
      </Text>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-gray-600">
        Tautan ini berlaku selama 1 jam.
      </Text>
    </EmailLayout>
  );
}

ConfirmSignupEmail.PreviewProps = {
  confirmUrl: "https://example.com/auth/verify?token_hash=abc123&type=signup",
  token: "123456",
  userName: "Jane Doe",
} as ConfirmSignupEmailProps;

export default ConfirmSignupEmail;
