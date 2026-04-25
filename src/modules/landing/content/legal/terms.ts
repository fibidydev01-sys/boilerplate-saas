import type { LegalPage } from "../../types";

export const termsContent: LegalPage = {
  slug: "terms",
  title: "Terms of Service",
  lastUpdated: "2026-04-24",
  intro: [
    "These Terms of Service govern your use of Your App, including the website, the source code, and the documentation. By purchasing or using Your App, you agree to these terms.",
  ],
  sections: [
    {
      heading: "Purchase and license",
      paragraphs: [
        "When you purchase Your App, you are granted a license to use the materials as described in the Solo Developer License. Your right to use the materials is tied to your active license.",
        "All purchases are one-time payments. There are no recurring subscription charges. Lifetime updates are included at no additional cost.",
      ],
    },
    {
      heading: "Refund policy",
      paragraphs: [
        "We offer a fourteen-day refund window from the date of purchase. If Your App does not meet your needs, reply to your purchase receipt within fourteen days and we will issue a full refund.",
        "After the fourteen-day window, purchases are final. This policy applies regardless of whether you have downloaded the files.",
      ],
    },
    {
      heading: "Support model",
      paragraphs: [
        "Your App is sold as a documentation-first product. The primary reference is the included 62-page Docusaurus documentation site, covering setup, architecture, every feature, troubleshooting scenarios, and deployment. The kit is self-contained by design — a reference that scales with your project as it grows.",
        "For genuine bugs and blockers not covered in the documentation, reply to your purchase receipt. Custom development, private consulting, scheduled calls, and hands-on integration work are not part of the purchase — those are separate engagements available on request.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "You agree not to use Your App for any purpose that is unlawful, infringing, or prohibited by the Acceptable Use Policy. Violation of the Acceptable Use Policy may result in termination of your license without refund.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "Your App retains all intellectual property rights in the source code, documentation, and associated materials. Your license grants usage rights, not ownership.",
        "End products you build using Your App are yours. We make no claim to code you write on top of the boilerplate.",
      ],
    },
    {
      heading: "Your responsibilities",
      paragraphs: [
        "You are responsible for the applications you build using Your App, including:",
      ],
      list: {
        type: "bulleted",
        items: [
          "Compliance with all applicable laws and regulations, including data protection laws such as GDPR, CCPA, UU PDP, or their local equivalents.",
          "The security and integrity of your deployments, credentials, and end-user data.",
          "Any contractual or regulatory obligations you have toward your own users or clients.",
          "Accurate configuration of third-party integrations such as Supabase, Lemon Squeezy, and Resend.",
        ],
      },
    },
    {
      heading: "Warranties and disclaimers",
      paragraphs: [
        "Your App is provided as-is, without warranty of any kind. While we maintain high code quality standards, we do not guarantee the software will meet your specific requirements or be error-free. See the Disclaimer for full details.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, Your App shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the materials. Our total aggregate liability is limited to the amount you paid for your license in the twelve months preceding any claim.",
      ],
    },
    {
      heading: "Account termination",
      paragraphs: [
        "We reserve the right to terminate licenses that are found to be in violation of the License Terms or the Acceptable Use Policy. Terminated licenses are not eligible for refund after the fourteen-day window.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These Terms of Service are governed by the laws of Indonesia, without regard to conflict of laws principles. Any disputes will be resolved in the competent courts of Indonesia.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these Terms of Service from time to time. Material changes will be announced via email to active license holders. The version in effect at the time of your purchase continues to govern your purchase unless you explicitly accept a newer version.",
      ],
    },
  ],
  contact: {
    name: "Your App Support",
    email: "hello@fibidy.com",
  },
};
