import type { LegalPage } from "../../types";

export const disclaimerContent: LegalPage = {
  slug: "disclaimer",
  title: "Disclaimer",
  lastUpdated: "2026-04-24",
  intro: [
    "The information and materials provided by ShipKit are intended for general informational and developmental purposes. This disclaimer outlines the limitations of our liability and the expectations you should have when using our products.",
  ],
  sections: [
    {
      heading: "No warranty",
      paragraphs: [
        "ShipKit is provided on an as-is and as-available basis, without warranty of any kind, either express or implied. We do not warrant that the software will be uninterrupted, error-free, or free from security vulnerabilities.",
        "While we take reasonable care to maintain code quality and security, you are responsible for reviewing, testing, and deploying the materials in a manner appropriate to your use case.",
      ],
    },
    {
      heading: "Not legal, financial, or tax advice",
      paragraphs: [
        "Any sample documents, configurations, or copy included in ShipKit (including but not limited to this Privacy Policy template, Terms of Service template, or License text) are provided for illustrative purposes only. They do not constitute legal, financial, or tax advice.",
        "Before using such documents in a production context, consult with a qualified professional in your jurisdiction to ensure they meet your specific legal and regulatory requirements.",
      ],
    },
    {
      heading: "Third-party services",
      paragraphs: [
        "ShipKit integrates with third-party services including Supabase, Lemon Squeezy, Resend, and others. We are not responsible for the availability, pricing, policies, or behavior of these third-party services.",
        "You are responsible for reviewing and complying with the terms and policies of each third-party service you use.",
      ],
    },
    {
      heading: "No guarantee of results",
      paragraphs: [
        "Using ShipKit does not guarantee commercial success, traffic, revenue, or any other specific outcome. The boilerplate is a tool; the results depend on how you use it, what you build, and how you go to market.",
      ],
    },
    {
      heading: "External links",
      paragraphs: [
        "The ShipKit website and documentation may contain links to external websites. We do not endorse or assume responsibility for the content, privacy policies, or practices of any third-party sites or services.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, ShipKit shall not be liable for any damages arising from your use of the software, including direct, indirect, incidental, consequential, or punitive damages, even if we have been advised of the possibility of such damages.",
      ],
    },
  ],
  contact: {
    name: "ShipKit Support",
    email: "support@shipkit.dev",
  },
};
