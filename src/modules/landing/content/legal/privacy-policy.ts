import type { LegalPage } from "../../types";

export const privacyPolicyContent: LegalPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  lastUpdated: "2026-04-24",
  intro: [
    "This Privacy Policy describes how ShipKit collects, uses, and shares information when you visit our website or purchase our products.",
    "We take privacy seriously. We collect the minimum information needed to run our business and we do not sell your data to anyone.",
  ],
  sections: [
    {
      heading: "Information we collect",
      paragraphs: [
        "We collect information you provide directly to us when you purchase a license, sign up for updates, or contact support. This includes your name, email address, and payment information.",
        "We also collect basic analytics information about how visitors use our website, including page views, referrer URLs, and device type. This information is aggregated and does not identify individual visitors.",
      ],
    },
    {
      heading: "How we use your information",
      list: {
        type: "bulleted",
        items: [
          "To process purchases and deliver your license.",
          "To send transactional emails such as purchase receipts and license updates.",
          "To provide customer support when you reach out.",
          "To send occasional product updates, if you have opted in.",
          "To improve the website based on aggregate analytics.",
        ],
      },
    },
    {
      heading: "Payment information",
      paragraphs: [
        "Payments are processed by our payment provider. We do not store credit card numbers on our servers. The payment provider's own privacy policy governs their handling of your payment information.",
      ],
    },
    {
      heading: "Cookies and analytics",
      paragraphs: [
        "We use cookies to remember your preferences and to measure aggregate website usage. You can disable cookies in your browser settings, though some site features may not work as expected.",
      ],
    },
    {
      heading: "Information sharing",
      paragraphs: [
        "We do not sell your personal information. We share data only with service providers that help us run the business (payment processing, email delivery, analytics) and only to the extent necessary for those services to function.",
      ],
    },
    {
      heading: "Data retention",
      paragraphs: [
        "We retain purchase and license information for as long as your license is active. If you request deletion of your account, we will remove personal data except where retention is required by law (for example, tax records).",
      ],
    },
    {
      heading: "Your rights",
      list: {
        type: "bulleted",
        items: [
          "Request access to the personal data we hold about you.",
          "Request correction of inaccurate personal data.",
          "Request deletion of your personal data, subject to legal retention requirements.",
          "Opt out of marketing communications at any time.",
        ],
      },
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. Material changes will be announced via email to active license holders. The last-updated date at the top of this page reflects the most recent revision.",
      ],
    },
  ],
  contact: {
    name: "ShipKit Support",
    email: "support@shipkit.dev",
  },
};
