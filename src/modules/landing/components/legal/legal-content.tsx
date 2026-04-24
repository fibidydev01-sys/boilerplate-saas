import type { LegalPage, LegalSection } from "../../types";

type LegalContentProps = {
  page: LegalPage;
};

export function LegalContent({ page }: LegalContentProps) {
  return (
    <article className="max-w-none">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {formatDate(page.lastUpdated)}
        </p>
      </header>

      {page.intro && page.intro.length > 0 ? (
        <div className="mb-10 space-y-4 text-base leading-relaxed text-muted-foreground">
          {page.intro.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      <div className="space-y-10">
        {page.sections.map((section, idx) => (
          <SectionBlock key={idx} section={section} />
        ))}
      </div>

      {page.contact ? (
        <footer className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </h3>
          <p className="text-base">
            <span className="font-medium">{page.contact.name}</span>
            <br />
            <a
              href={`mailto:${page.contact.email}`}
              className="text-primary hover:underline"
            >
              {page.contact.email}
            </a>
          </p>
        </footer>
      ) : null}
    </article>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">
        {section.heading}
      </h2>

      {section.paragraphs && section.paragraphs.length > 0 ? (
        <div className="mb-4 space-y-3 text-base leading-relaxed text-foreground">
          {section.paragraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {section.list ? (
        section.list.type === "numbered" ? (
          <ol className="ml-6 list-decimal space-y-2 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            {section.list.items.map((item, idx) => (
              <li key={idx} className="pl-2">
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <ul className="ml-6 list-disc space-y-2 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            {section.list.items.map((item, idx) => (
              <li key={idx} className="pl-2">
                {item}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {section.subsections && section.subsections.length > 0 ? (
        <div className="mt-6 space-y-6 border-l-2 border-border pl-6">
          {section.subsections.map((sub, idx) => (
            <SectionBlock key={idx} section={sub} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
