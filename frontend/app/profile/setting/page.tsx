import { Suspense } from "react";
import ProfileSettingPage from "./ProfileSettingPage";

export default function SettingPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSettingPage />
    </Suspense>
  );
}
