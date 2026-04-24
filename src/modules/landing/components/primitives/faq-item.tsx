import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem as FaqItemType } from "../../types";

type FaqListProps = {
  items: FaqItemType[];
};

/**
 * Renders the full FAQ as a controlled accordion.
 * Uses shadcn Accordion primitive — install via:
 *   npx shadcn@latest add accordion
 */
export function FaqList({ items }: FaqListProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger className="text-left text-base font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
