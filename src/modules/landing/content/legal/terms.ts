import type { LegalPage } from "../../types";

export const termsContent: LegalPage = {
  slug: "terms",
  title: "Terms of Service",
  lastUpdated: "2026-04-24",
  intro: [
    "These Terms of Service govern your use of ShipKit, including the website, the source code, and the documentation. By purchasing or using ShipKit, you agree to these terms.",
  ],
  sections: [
    {
      heading: "Purchase and license",
      paragraphs: [
        "When you purchase ShipKit, you are granted a license to use the materials as described in the License Terms. Your right to use the materials is tied to your active license.",
        "All purchases are one-time payments. There are no recurring subscription charges for base tier access.",
      ],
    },
    {
      heading: "Refund policy",
      paragraphs: [
        "We offer a fourteen-day refund window from the date of purchase. If ShipKit does not meet your needs, reply to your purchase receipt within fourteen days and we will issue a full refund.",
        "After the fourteen-day window, purchases are final. This policy applies regardless of whether you have downloaded the files.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "You agree not to use ShipKit for any purpose that is unlawful, infringing, or prohibited by the Acceptable Use Policy. Violation of the Acceptable Use Policy may result in termination of your license without refund.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "ShipKit retains all intellectual property rights in the source code, documentation, and associated materials. Your license grants usage rights, not ownership.",
        "End products you build using ShipKit are yours. We make no claim to code you write on top of the boilerplate.",
      ],
    },
    {
      heading: "Warranties and disclaimers",
      paragraphs: [
        "ShipKit is provided as-is, without warranty of any kind. While we strive for high code quality, we do not guarantee the software will meet your specific requirements or be error-free. See the Disclaimer for full details.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, ShipKit shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the materials. Our total liability is limited to the amount you paid for your license.",
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
        "These Terms of Service are governed by the laws of the jurisdiction where ShipKit operates. Any disputes will be resolved in the courts of that jurisdiction.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these Terms of Service from time to time. Material changes will be announced via email to active license holders. Continued use of ShipKit after changes take effect constitutes acceptance of the updated terms.",
      ],
    },
  ],
  contact: {
    name: "ShipKit Support",
    email: "support@shipkit.dev",
  },
};
