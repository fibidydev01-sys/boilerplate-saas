/**
 * Email: Password Recovery.
 *
 * Dikirim saat user trigger `resetPasswordForEmail`. Link-nya harus
 * bawa user ke `/reset-password` (via callback route yang exchange
 * code → recovery session).
 */

import { Text } from "@react-email/components";
import { EmailLayout, PrimaryButton } from "./_layout";
import { brandingConfig } from "@/config";

export interface RecoveryEmailProps {
  resetUrl: string;
  token: string;
  userName?: string;
}

export function RecoveryEmail({
  resetUrl,
  token,
  userName,
}: RecoveryEmailProps) {
  const greeting = userName ? `Hai ${userName},` : "Hai,";

  return (
    <EmailLayout preview={`Reset password ${brandingConfig.name} kamu`}>
      <Text className="m-0 mb-4 text-base leading-relaxed text-gray-900">
        {greeting}
      </Text>

      <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
        Kami menerima permintaan untuk mereset password akun kamu di{" "}
        {brandingConfig.name}. Klik tombol di bawah untuk memilih password
        baru.
      </Text>

      <div style={{ margin: "24px 0" }}>
        <PrimaryButton href={resetUrl}>Reset Password</PrimaryButton>
      </div>

      <Text className="m-0 mb-2 text-sm leading-relaxed text-gray-600">
        Tombol tidak bekerja? Salin dan tempel tautan ini ke browser kamu:
      </Text>
      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-900 break-all">
        {resetUrl}
      </Text>

      <Text className="m-0 text-sm leading-relaxed text-gray-600">
        Atau gunakan kode ini:{" "}
        <span className="font-mono font-semibold text-gray-900">{token}</span>
      </Text>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-gray-600">
        Tautan ini berlaku selama 1 jam. Jika kamu tidak meminta reset
        password, abaikan email ini — password kamu tidak akan berubah.
      </Text>
    </EmailLayout>
  );
}

RecoveryEmail.PreviewProps = {
  resetUrl: "https://example.com/auth/verify?token_hash=abc123&type=recovery",
  token: "123456",
  userName: "Jane Doe",
} as RecoveryEmailProps;

export default RecoveryEmail;
