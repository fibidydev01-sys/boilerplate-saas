import type { LegalPage } from "../../types";

export const acceptableUseContent: LegalPage = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  lastUpdated: "2026-04-24",
  intro: [
    "This Acceptable Use Policy sets out the rules that apply when using Your App materials or services. It is designed to keep Your App, its users, and the broader community safe.",
    "Violations of this policy may result in license termination without refund. We reserve the right to interpret and enforce this policy at our discretion.",
  ],
  sections: [
    {
      heading: "What you may do",
      paragraphs: [
        "Within the bounds of the Solo Developer License, you are free to:",
      ],
      list: {
        type: "bulleted",
        items: [
          "Use Your App on unlimited personal and side projects.",
          "Use Your App on unlimited client projects as the sole developer delivering the work.",
          "Build and sell commercial products, SaaS applications, and startups on top of Your App.",
          "Modify, adapt, and extend the source code to fit your needs.",
          "Deploy to any hosting environment you control.",
          "Open-source applications you build on top, as long as you do not include Your App source code in the public release.",
        ],
      },
    },
    {
      heading: "Prohibited uses",
      paragraphs: [
        "You agree not to use Your App materials or services for any of the following purposes:",
      ],
      list: {
        type: "bulleted",
        items: [
          "Any unlawful, fraudulent, or malicious activity.",
          "Reselling, sublicensing, or redistributing the Your App source code or documentation as a boilerplate, starter kit, template, course asset, or competing product.",
          "Publishing the Your App source code to a public repository such as public GitHub, GitLab, Bitbucket, Codeberg, or any publicly accessible Git host.",
          "Repackaging, rebranding, or re-skinning Your App and distributing it as your own work.",
          "Sharing your license credentials, download link, or purchase receipt with other developers to enable their use of Your App.",
          "Using Your App materials to train machine-learning or language models, or including them in training datasets.",
          "Building products that infringe on the intellectual property rights of others.",
          "Building products that facilitate harassment, discrimination, or hate speech.",
          "Distributing malware, spyware, ransomware, or any form of malicious software.",
          "Phishing, social engineering, or any attempt to defraud users.",
          "Building products that violate privacy laws in the jurisdictions where they operate.",
          "Bulk-scraping, reverse-engineering, or circumventing license validation mechanisms.",
        ],
      },
    },
    {
      heading: "Gray areas — ask before assuming",
      paragraphs: [
        "Some scenarios sit close to a line. If your use case matches one of the following, contact us at the email below before shipping:",
      ],
      list: {
        type: "bulleted",
        items: [
          "Handing a client a copy of the raw Your App source tree — not allowed. You deliver the running application; your client is licensed to run what you built, not to develop further on the kit itself.",
          "Onboarding in-house team members for a client — each developer who actively works with the source code needs their own license.",
          "Using Your App in a course, tutorial, or paid educational content — generally not permitted, because it functionally redistributes the kit.",
          "Mirroring Your App to a private Git host for deployment purposes — generally fine, as long as access is restricted to licensed developers on your team.",
        ],
      },
    },
    {
      heading: "Content standards",
      paragraphs: [
        "Products you build with Your App must comply with applicable laws and the terms of service of the platforms they are deployed on. We may decline to support, or terminate access for, projects that demonstrably violate these standards.",
      ],
    },
    {
      heading: "Security responsibilities",
      list: {
        type: "bulleted",
        items: [
          "Keep your license credentials and API keys confidential.",
          "Rotate credentials promptly if you suspect they have been exposed.",
          "Report security vulnerabilities in Your App to us privately before public disclosure.",
          "Do not intentionally exploit known vulnerabilities in Your App or third-party services.",
        ],
      },
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
        "We reserve the right to investigate violations of this policy and take action, including warning users, suspending support, or terminating licenses without refund.",
        "Enforcement decisions are made at our discretion based on the severity and context of the violation. Your App may also pursue legal remedies for unauthorized redistribution, including injunctive relief in any jurisdiction where the violation is occurring.",
      ],
    },
  ],
  contact: {
    name: "Your App Support",
    email: "admin@fibidy.com",
  },
};
