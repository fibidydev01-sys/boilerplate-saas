import type { ShowcaseContent } from "../types";

/**
 * PLACEHOLDER CONTENT — replace before publish.
 * Fill in with real products once customers start shipping.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 */
export const showcaseContent: ShowcaseContent = {
  eyebrow: "Showcase",
  heading: "Built with {appName}",
  description:
    "From indie makers to small teams, see what builders are shipping.",
  items: [
    {
      name: "Placeholder App",
      category: "Productivity",
      description:
        "Team collaboration tool built on {appName} multi-tenant foundation.",
      tags: ["SaaS", "Collaboration"],
    },
    {
      name: "Placeholder App",
      category: "Creator Economy",
      description:
        "Subscription platform for independent creators powered by {appName}.",
      tags: ["Subscriptions", "Content"],
    },
    {
      name: "Placeholder App",
      category: "Developer Tools",
      description:
        "API monitoring dashboard shipped in two weeks with {appName}.",
      tags: ["DevTools", "Analytics"],
    },
    {
      name: "Placeholder App",
      category: "Finance",
      description:
        "Invoice and billing automation tool for freelancers.",
      tags: ["Finance", "Automation"],
    },
    {
      name: "Placeholder App",
      category: "Education",
      description:
        "Online course platform with multi-tier memberships.",
      tags: ["EdTech", "Memberships"],
    },
    {
      name: "Placeholder App",
      category: "Marketplace",
      description:
        "Two-sided marketplace with per-seller commerce isolation.",
      tags: ["Marketplace", "Multi-tenant"],
    },
  ],
};
