import type { ProblemContent } from "../types";

export const problemContent: ProblemContent = {
  eyebrow: "Problem",
  heading: "Launch your SaaS 60+ hours faster",
  items: [
    { duration: "6 hrs", label: "wiring up Supabase auth" },
    { duration: "+1 day", label: "setting up OAuth providers" },
    { duration: "+2 days", label: "integrating Lemon Squeezy payments" },
    { duration: "+4 hrs", label: "implementing webhook verification" },
    { duration: "+1 day", label: "encrypting API keys and secrets" },
    { duration: "+2 hrs", label: "setting up email templates" },
    { duration: "+1 day", label: "building a permission system" },
    { duration: "+4 hrs", label: "handling multi-tenant isolation" },
    { duration: "+∞ hrs", label: "overthinking architecture decisions" },
  ],
  conclusion: {
    totalHours: "60+",
    label: "hours of",
    aside: "headaches",
  },
};
