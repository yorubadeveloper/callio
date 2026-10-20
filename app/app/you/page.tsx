import type { Metadata } from "next";
import { YouView } from "@/components/app/you";
import { currentUser } from "@/lib/server/backend";

export const metadata: Metadata = { title: "You" };

export default async function YouPage() {
  return <YouView user={(await currentUser())!} />;
}
