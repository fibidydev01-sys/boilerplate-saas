/**
 * Email: Reauthentication.
 *
 * Dikirim untuk step-up auth — dipake sebelum action sensitif (ganti
 * password tanpa session recovery, delete account, dll). User dapet
 * 6-digit OTP yang harus dimasukin ke form.
 *
 * Di flow ini gak ada button/link — murni OTP code.
 */

import { Text } from "@react-email/components";
import { EmailLayout } from "./_layout";
import { brandingConfig } from "@/config";

export interface ReauthEmailProps {
  token: string;
  userName?: string;
}

export function ReauthEmail({ token, userName }: ReauthEmailProps) {
  const greeting = userName ? `Hai ${userName},` : "Hai,";

  return (
    <EmailLayout preview={`Kode verifikasi ${brandingConfig.name}`}>
      <Text className="m-0 mb-4 text-base leading-relaxed text-gray-900">
        {greeting}
      </Text>

      <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
        Masukkan kode berikut untuk melanjutkan tindakan yang memerlukan
        verifikasi ulang di {brandingConfig.name}:
      </Text>

      <div
        style={{
          margin: "24px 0",
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "6px",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: "#111827",
          }}
        >
          {token}
        </Text>
      </div>

      <Text className="m-0 text-sm leading-relaxed text-gray-600">
        Kode ini berlaku selama 5 menit dan hanya bisa dipakai sekali. Jika
        kamu tidak meminta verifikasi ini, abaikan email ini dan segera
        amankan akun kamu.
      </Text>
    </EmailLayout>
  );
}

ReauthEmail.PreviewProps = {
  token: "123456",
  userName: "Jane Doe",
} as ReauthEmailProps;

export default ReauthEmail;
