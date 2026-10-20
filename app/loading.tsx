import { LogoLoader } from "@/components/brand/logo-loader";

// Shown while a signed-in area (and its layout) loads, e.g. the first jump into the app.
export default function RootLoading() {
  return <LogoLoader className="min-h-dvh bg-page" />;
}
