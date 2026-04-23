/**
 * Email: Magic Link.
 *
 * Dikirim saat user request passwordless login via signInWithOtp.
 *
 * Supabase hook akan kirim `email_action_type: "magiclink"` untuk user
 * yang sudah exist, ATAU `email_action_type: "signup"` untuk user baru
 * (kalau shouldCreateUser: true). Dispatcher di send-auth-email.ts
 * route keduanya ke template ini karena dari sisi user UX-nya sama:
 * klik link = masuk.
 */

import { Text } from "@react-email/components";
import { EmailLayout, PrimaryButton } from "./_layout";
import { brandingConfig } from "@/config";

export interface MagicLinkEmailProps {
  magicUrl: string;
  token: string;
  userName?: string;
  isNewUser?: boolean;
}

export function MagicLinkEmail({
  magicUrl,
  token,
  userName,
  isNewUser,
}: MagicLinkEmailProps) {
  const greeting = userName ? `Hai ${userName},` : "Hai,";
  const intro = isNewUser
    ? `Selamat datang di ${brandingConfig.name}! Klik tombol di bawah untuk menyelesaikan pendaftaran dan masuk ke akun kamu.`
    : `Kamu meminta tautan masuk untuk ${brandingConfig.name}. Klik tombol di bawah untuk melanjutkan.`;

  return (
    <EmailLayout preview={`Tautan masuk untuk ${brandingConfig.name}`}>
      <Text className="m-0 mb-4 text-base leading-relaxed text-gray-900">
        {greeting}
      </Text>

      <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
        {intro}
      </Text>

      <div style={{ margin: "24px 0" }}>
        <PrimaryButton href={magicUrl}>Masuk ke {brandingConfig.shortName}</PrimaryButton>
      </div>

      <Text className="m-0 mb-2 text-sm leading-relaxed text-gray-600">
        Tombol tidak bekerja? Salin dan tempel tautan ini ke browser kamu:
      </Text>
      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-900 break-all">
        {magicUrl}
      </Text>

      <Text className="m-0 text-sm leading-relaxed text-gray-600">
        Atau gunakan kode ini jika diminta:{" "}
        <span className="font-mono font-semibold text-gray-900">{token}</span>
      </Text>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-gray-600">
        Tautan ini berlaku selama 1 jam dan hanya bisa dipakai sekali. Jika
        kamu tidak meminta tautan ini, abaikan email ini.
      </Text>
    </EmailLayout>
  );
}

MagicLinkEmail.PreviewProps = {
  magicUrl: "https://example.com/auth/verify?token_hash=abc123&type=magiclink",
  token: "123456",
  userName: "Jane Doe",
  isNewUser: false,
} as MagicLinkEmailProps;

export default MagicLinkEmail;
