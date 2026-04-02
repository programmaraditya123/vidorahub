"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface PortalProps {
  children: ReactNode;
}

const Portal = ({ children }: PortalProps) => {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalRoot(document.getElementById("portal-root"));
  }, []);

  if (!mounted || !portalRoot) return null;

  return createPortal(children, portalRoot);
};

export default Portal;