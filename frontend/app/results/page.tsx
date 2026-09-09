import { Suspense } from "react";
import ResultsPageClient from "./ResultsPageClient";

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsPageClient />
    </Suspense>
  );
}
