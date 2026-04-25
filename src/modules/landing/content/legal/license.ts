import type { LegalPage } from "../../types";

export const licenseContent: LegalPage = {
  slug: "license",
  title: "Solo Developer License",
  lastUpdated: "2026-04-24",
  intro: [
    "When you purchase Your App, you are granted access to the complete source code, documentation, and associated materials under the Solo Developer License described below.",
    "Plain English summary: one developer, unlimited projects (personal or client), no resale of the kit itself, lifetime updates, fourteen-day refund. The full terms are below. If your use case sits close to a line, contact us at the email at the bottom before assuming.",
  ],
  sections: [
    {
      heading: "License overview",
      list: {
        type: "numbered",
        items: [
          "Your App retains ownership of all materials (source code and documentation) but grants you usage rights under the terms of this license.",
          "The license grants you, one individual developer, an ongoing, non-exclusive, worldwide right to use the provided materials to create end products.",
          "You may use the materials to create unlimited end products for yourself or for multiple clients. The end products may or may not be sold. Freelancers and consultants may purchase on their own behalf for use in client work.",
          "This is a license, not a sale. You do not acquire ownership rights in Your App itself.",
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
          "Use the materials in client work as the sole developer delivering the project.",
          "Modify, adapt, and extend the materials for your own projects.",
          "Use the materials in both personal and commercial projects.",
          "Deploy end products on any platform or hosting provider.",
          "Receive all future updates at no additional cost for as long as Your App is distributed.",
        ],
      },
    },
    {
      heading: "What you are not allowed to do",
      list: {
        type: "bulleted",
        items: [
          "Resell, sublicense, or redistribute the Your App source code, documentation, or any substantial portion of it — as a boilerplate, starter kit, template, course asset, or competing product.",
          "Publish the Your App source code to any public repository, including public GitHub, GitLab, Bitbucket, or any publicly accessible Git host.",
          "Repackage, rebrand, or re-skin Your App and distribute it as your own work.",
          "Share your license credentials, download link, or purchase receipt with other developers to enable their use of Your App.",
          "Include the materials in an open-source project without prior written permission.",
          "Use the materials to train machine-learning or language models, or include them in training datasets.",
          "Use the materials to build products that facilitate fraud, abuse, spam, or any illegal activity.",
        ],
      },
    },
    {
      heading: "Seat restriction — one developer",
      paragraphs: [
        "This License covers ONE individual human developer. If multiple developers on your team need hands-on access to the Your App source code, each developer must purchase their own License.",
        "This restriction applies to active code access only. Non-developers who view the running application — designers, product managers, clients, stakeholders, testers — do not require separate Licenses.",
        "Sharing a single License across multiple developers violates this License, regardless of company structure or employment relationship.",
      ],
    },
    {
      heading: "Client work and delivery",
      paragraphs: [
        "You are permitted to use Your App to build applications you deliver to clients as a freelancer or contractor. The following rules apply:",
      ],
      list: {
        type: "bulleted",
        items: [
          "You deliver the running application — deployed, or as source output representing what you built. The client receives what you made, not the underlying kit.",
          "You remain responsible for the client relationship and any subsequent support the client requests.",
          "If your client later wants in-house developers to maintain or extend the codebase, those developers each need their own License to access the Your App source and patterns.",
          "You may not hand the client a copy of the raw Your App source tree and claim they are licensed to use it. They are not.",
        ],
      },
    },
    {
      heading: "License validation",
      list: {
        type: "bulleted",
        items: [
          "Your license is validated through your purchase credentials.",
          "One license is valid for use by one individual developer.",
          "Additional licenses must be purchased for additional seats.",
          "Access to all materials is tied to your license.",
        ],
      },
    },
    {
      heading: "Support model",
      paragraphs: [
        "Your App is sold as a documentation-first product. The primary reference is the included 62-page Docusaurus documentation, covering setup, architecture, every feature, troubleshooting scenarios, and deployment. The kit is self-contained by design — a reference that scales with your project.",
        "For genuine bugs and blockers not covered in the documentation, reply to your purchase receipt. Custom development, private consulting, and hands-on integration work are not part of the license — those are separate engagements.",
      ],
      list: {
        type: "bulleted",
        items: [
          "Your license includes lifetime access to updates.",
          "Updates are published through the purchase channel library.",
          "The Docusaurus reference is updated alongside code changes.",
        ],
      },
    },
    {
      heading: "Refund policy",
      paragraphs: [
        "You are entitled to a full refund within fourteen (14) days of purchase, no questions asked. Reply to your purchase receipt to request one.",
        "After the fourteen-day window, refunds are considered on a case-by-case basis and are not guaranteed.",
        "Upon refund, your License is terminated and you must cease all use of Your App and delete all copies in your possession.",
      ],
    },
    {
      heading: "No warranty and limitation of liability",
      paragraphs: [
        "Your App is provided as-is and as-available, without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.",
        "In no event shall Your App, its contributors, or affiliates be liable for any claim, damages, loss of profits, loss of data, business interruption, or other liability arising from, out of, or in connection with Your App or its use.",
        "You are solely responsible for the applications you build with Your App, including their security, compliance with applicable laws (such as GDPR, CCPA, UU PDP, or other local equivalents), and fitness for your end users. Your App provides a starting point, not a compliance guarantee.",
        "Total aggregate liability under this License shall not exceed the amount you paid for Your App in the twelve months preceding the claim.",
      ],
    },
    {
      heading: "Termination",
      paragraphs: [
        "This License is effective upon purchase and continues perpetually until terminated.",
        "This License terminates automatically, without notice, if you fail to comply with any term — particularly the prohibited uses above.",
        "Upon termination, you must cease all use of Your App and destroy all copies, complete or partial, in your possession or control.",
        "The no-warranty, limitation-of-liability, and governing-law sections survive termination.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "This License shall be governed by and construed in accordance with the laws of Indonesia, without regard to its conflict of laws provisions.",
        "Any dispute shall first be attempted to be resolved through good-faith negotiation. If unresolved within thirty days, the dispute shall be brought before the competent courts of Indonesia.",
      ],
    },
    {
      heading: "Terms modification",
      paragraphs: [
        "Your App may modify these license terms from time to time. Any changes will not be retroactive and will not affect licenses purchased before the modification date.",
        "The version of the License in effect at the time of your purchase continues to govern your use.",
      ],
    },
  ],
  contact: {
    name: "Your App Support",
    email: "hello@fibidy.com",
  },
};
