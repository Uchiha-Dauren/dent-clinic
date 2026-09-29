import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
export default function Accordion({ items }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="accordion">
      {items.map(([q, a], i) => (
        <AccordionPrimitive.Item key={q} value={String(i)} className="accordion-item">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="accordion-trigger">
              <span>{q}</span>
              <Plus size={19} />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="accordion-content">
            <p>{a}</p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
