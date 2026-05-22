"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Globe2 } from "lucide-react";

type SourceLogoProps = {
  candidates: string[];
  sourceType: string;
};

export function SourceLogo({ candidates, sourceType }: SourceLogoProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const logoUrl = sourceType === "url" ? candidates[candidateIndex] : null;

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates.join("|"), sourceType]);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-full w-full object-contain p-1.5"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setCandidateIndex((current) => current + 1)}
      />
    );
  }

  const Icon = sourceType === "file" ? FileText : sourceType === "url" ? Globe2 : BookOpen;

  return <Icon size={16} />;
}
