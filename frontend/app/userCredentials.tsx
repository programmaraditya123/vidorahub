"use client";

import useUserCredential from "@/src/hooks/ui/Shared/useUserCredential";


export default function UserCredentialProvider() {
  useUserCredential();

  return null;
}