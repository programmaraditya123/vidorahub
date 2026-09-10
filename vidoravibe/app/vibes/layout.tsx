import type { ReactNode } from "react";
import { AuthGate } from "@/components/vibes/AuthGate";
export default function VibesLayout({ children }: { children: ReactNode }) { return <AuthGate>{children}</AuthGate>; }
