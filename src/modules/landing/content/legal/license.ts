import type { LegalPage } from "../../types";

export const licenseContent: LegalPage = {
  slug: "license",
  title: "License Terms",
  lastUpdated: "2026-04-24",
  intro: [
    "When you purchase ShipKit, you are granted access to the complete source code and documentation package.",
    "Please read the following terms carefully to understand your license. If you have any questions about whether the license fits your use case, contact us at the email below.",
  ],
  sections: [
    {
      heading: "License overview",
      list: {
        type: "numbered",
        items: [
          "ShipKit retains ownership of all materials (source code and documentation) but grants you usage rights under the terms of this license.",
          "The license grants you an ongoing, non-exclusive, worldwide right to use the provided materials to create an end product.",
          "You may use the materials to create multiple end products for yourself or for multiple clients. The end products may or may not be sold. Resellers and freelancers are allowed to purchase on their client's behalf.",
        ],
      },
    },
    {
      heading: "What you are allowed to do",
      list: {
        type: "bulleted",
        items: [
          "Create an unlimited number of end products using the provided materials.",
          "Sell any end product built using the provided materials.",
          "Modify the materials for your own projects.",
          "Use the materials in both personal and commercial projects.",
          "Use the materials for client work (Pro and Agency licenses).",
          "Deploy end products on any platform or hosting provider.",
          "Share access with team members covered by your license tier.",
        ],
      },
    },
    {
      heading: "What you are not allowed to do",
      list: {
        type: "bulleted",
        items: [
          "Create a product that sells or redistributes the ShipKit materials themselves.",
          "Redistribute the materials without explicit written permission from ShipKit.",
          "Share your license credentials with individuals or companies not covered by your tier.",
          "Include the materials in an open-source project without prior written permission.",
          "Sell or distribute the materials as part of a development kit or template collection.",
          "Use the materials to create a product that competes directly with ShipKit itself.",
          "Resell the documentation as a standalone product.",
        ],
      },
    },
    {
      heading: "License tiers",
      paragraphs: [
        "Personal license covers a single developer working on personal and unlimited client projects.",
        "Pro license covers an individual developer with commercial resale rights and access to the private community.",
        "Agency license covers a team of up to ten developers under a single organization with priority support.",
      ],
    },
    {
      heading: "License validation",
      list: {
        type: "bulleted",
        items: [
          "Your license is validated through your purchase credentials.",
          "One license is valid for use by one person or one organization, depending on the tier.",
          "Additional licenses must be purchased for additional seats.",
          "Access to all materials is tied to your license.",
        ],
      },
    },
    {
      heading: "Support and updates",
      list: {
        type: "bulleted",
        items: [
          "Your license includes lifetime access to updates.",
          "Technical support is provided according to the terms of your purchase tier.",
          "Access to the materials is provided through the platform specified at purchase.",
          "Updates are published through the changelog and announced to license holders.",
        ],
      },
    },
    {
      heading: "Terms modification",
      paragraphs: [
        "We reserve the right to modify these license terms at any time. Any changes will not be retroactive and will not affect licenses purchased before the modification date.",
      ],
    },
  ],
  contact: {
    name: "ShipKit Support",
    email: "support@shipkit.dev",
  },
};
