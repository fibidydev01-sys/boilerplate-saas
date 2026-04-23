/**
 * Email: Email Change Confirmation.
 *
 * Dikirim saat user ganti alamat email via `updateUser({ email: ... })`.
 * Supabase akan kirim email ke alamat BARU untuk konfirmasi — dan ke
 * alamat LAMA sebagai notifikasi (tergantung setting).
 *
 * `email_action_type: "email_change"` → template ini.
 */

import { Text } from "@react-email/components";
import { EmailLayout, PrimaryButton } from "./_layout";
import { brandingConfig } from "@/config";

export interface EmailChangeEmailProps {
  confirmUrl: string;
  token: string;
  newEmail?: string;
  userName?: string;
}

export function EmailChangeEmail({
  confirmUrl,
  token,
  newEmail,
  userName,
}: EmailChangeEmailProps) {
  const greeting = userName ? `Hai ${userName},` : "Hai,";

  return (
    <EmailLayout
      preview={`Konfirmasi perubahan email ${brandingConfig.name}`}
    >
      <Text className="m-0 mb-4 text-base leading-relaxed text-gray-900">
        {greeting}
      </Text>

      <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
        Kami menerima permintaan untuk mengubah alamat email akun{" "}
        {brandingConfig.name} kamu
        {newEmail ? (
          <>
            {" "}
            ke <strong className="text-gray-900">{newEmail}</strong>
          </>
        ) : (
          ""
        )}
        . Klik tombol di bawah untuk mengonfirmasi perubahan.
      </Text>

      <div style={{ margin: "24px 0" }}>
        <PrimaryButton href={confirmUrl}>Konfirmasi Perubahan</PrimaryButton>
      </div>

      <Text className="m-0 mb-2 text-sm leading-relaxed text-gray-600">
        Tombol tidak bekerja? Salin dan tempel tautan ini:
      </Text>
      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-900 break-all">
        {confirmUrl}
      </Text>

      <Text className="m-0 text-sm leading-relaxed text-gray-600">
        Atau gunakan kode ini:{" "}
        <span className="font-mono font-semibold text-gray-900">{token}</span>
      </Text>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-gray-600">
        Jika kamu tidak meminta perubahan ini, abaikan email ini dan segera
        amankan akun kamu dengan mengganti password.
      </Text>
    </EmailLayout>
  );
}

EmailChangeEmail.PreviewProps = {
  confirmUrl:
    "https://example.com/auth/verify?token_hash=abc123&type=email_change",
  token: "123456",
  newEmail: "new@example.com",
  userName: "Jane Doe",
} as EmailChangeEmailProps;

export default EmailChangeEmail;
