// NOTE: no "use client" here – this is a Server Component
import { Suspense } from "react";
import ChatPageClient from "./page.client";

export const dynamic = "force-dynamic"; // disables SSG/ISR for this route
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChatPageClient />
    </Suspense>
  );
}