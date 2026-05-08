"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function AnimatedFaqList({ items }: { items: FaqItem[] }) {
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <div className="divide-y divide-harlo-line overflow-hidden rounded-lg border border-harlo-line bg-white/95 shadow-sm">
      {items.map((faq, index) => {
        const isOpen = openFaq === index;

        return (
          <div key={faq.question} className="p-5 transition duration-300">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left text-lg font-semibold text-harlo-ink"
              aria-expanded={isOpen}
              onClick={() => setOpenFaq(isOpen ? -1 : index)}
            >
              {faq.question}
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-harlo-mist text-harlo-teal transition duration-300 ${isOpen ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className={`max-w-2xl pt-4 text-base leading-7 text-harlo-muted transition duration-300 ${isOpen ? "translate-y-0" : "-translate-y-1"}`}>
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
