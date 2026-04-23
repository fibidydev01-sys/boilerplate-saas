/**
 * Shared email shell — dipake semua template.
 *
 * Style: minimalist. Satu brand color (primary dari env), prose-heavy,
 * button inline, footer tipis. Gak ada image/icon di header — nama app
 * saja. Email client compatibility: semua style di-inline via @react-email,
 * dark mode pakai CSS var default.
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { brandingConfig } from "@/config";

interface EmailLayoutProps {
  /** Text singkat yang muncul di preview inbox (sebelum user buka) */
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  const brandColor = brandingConfig.theme.primaryColor;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: brandColor,
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans text-gray-900">
          <Container className="mx-auto max-w-[480px] px-6 py-10">
            {/* Header: text-only, tight */}
            <Section className="mb-8">
              <Text className="m-0 text-base font-semibold tracking-tight text-gray-900">
                {brandingConfig.name}
              </Text>
            </Section>

            {/* Body */}
            <Section>{children}</Section>

            {/* Footer */}
            <Hr className="my-8 border-gray-200" />
            <Section>
              <Text className="m-0 text-xs leading-relaxed text-gray-500">
                Email ini dikirim otomatis oleh {brandingConfig.name}. Kalau
                kamu tidak meminta email ini, kamu bisa abaikan dengan aman —
                tidak ada tindakan lebih lanjut yang diperlukan.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/**
 * Primary button — link-styled sebagai button. React Email best practice:
 * pakai `<a>` bukan `<button>` supaya kompatibel semua email client.
 */
export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const brandColor = brandingConfig.theme.primaryColor;

  return (
    <a
      href={href}
      style={{
        backgroundColor: brandColor,
        color: "#ffffff",
        display: "inline-block",
        padding: "12px 24px",
        borderRadius: "6px",
        textDecoration: "none",
        fontWeight: 500,
        fontSize: "14px",
        lineHeight: "20px",
      }}
    >
      {children}
    </a>
  );
}
