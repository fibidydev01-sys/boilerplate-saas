import type { LegalPage } from "../../types";

export const acceptableUseContent: LegalPage = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  lastUpdated: "2026-04-24",
  intro: [
    "This Acceptable Use Policy sets out the rules that apply when using ShipKit materials or services. It is designed to keep ShipKit, its users, and the broader community safe.",
    "Violations of this policy may result in license termination without refund. We reserve the right to interpret and enforce this policy at our discretion.",
  ],
  sections: [
    {
      heading: "Prohibited uses",
      paragraphs: [
        "You agree not to use ShipKit materials or services for any of the following purposes:",
      ],
      list: {
        type: "bulleted",
        items: [
          "Any unlawful, fraudulent, or malicious activity.",
          "Building products that infringe on the intellectual property rights of others.",
          "Building products that facilitate harassment, discrimination, or hate speech.",
          "Distributing malware, spyware, ransomware, or any form of malicious software.",
          "Phishing, social engineering, or any attempt to defraud users.",
          "Building products that violate privacy laws in the jurisdictions where they operate.",
          "Bulk-scraping, reverse-engineering, or redistributing the ShipKit source code in violation of the License.",
          "Circumventing or attempting to circumvent license validation mechanisms.",
        ],
      },
    },
    {
      heading: "Content standards",
      paragraphs: [
        "Products you build with ShipKit must comply with applicable laws and the terms of service of the platforms they are deployed on. We may decline to support, or terminate access for, projects that demonstrably violate these standards.",
      ],
    },
    {
      heading: "Security responsibilities",
      list: {
        type: "bulleted",
        items: [
          "Keep your license credentials and API keys confidential.",
          "Rotate credentials promptly if you suspect they have been exposed.",
          "Report security vulnerabilities in ShipKit to us privately before public disclosure.",
          "Do not intentionally exploit known vulnerabilities in ShipKit or third-party services.",
        ],
      },
    },
    {
      heading: "Community conduct",
      paragraphs: [
        "If you participate in the ShipKit Discord, support channels, or other community spaces, treat other members with respect. Harassment, personal attacks, and spam are not tolerated and may result in removal from community spaces without affecting your license.",
      ],
    },
    {
      heading: "Reporting violations",
      paragraphs: [
        "If you believe another user is violating this Acceptable Use Policy, or you suspect a security issue, contact us at the email below. We review every report and act on credible ones.",
      ],
    },
    {
      heading: "Enforcement",
      paragraphs: [
        "We reserve the right to investigate violations of this policy and take action, including warning users, removing content from community spaces, suspending support, or terminating licenses without refund.",
        "Enforcement decisions are made at our discretion based on the severity and context of the violation.",
      ],
    },
  ],
  contact: {
    name: "ShipKit Support",
    email: "support@shipkit.dev",
  },
};
