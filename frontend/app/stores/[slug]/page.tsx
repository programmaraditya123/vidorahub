import { Suspense } from "react";
import type { Metadata } from "next";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import CategoryProducts from "./CategoryProducts";

export const metadata: Metadata = {
  title: "Shop by category | VidoraHub Stores",
  description: "Explore products from independent creators on VidoraHub. Search, compare prices, and discover your next favorite.",
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div className="page-wrapper">
    <div className="sidebar-container"><Sidebar /></div>
    <main className="main-content">
      <Suspense fallback={<p role="status" style={{ padding: 32 }}>Loading category…</p>}>
        <CategoryProducts key={slug} slug={slug} />
      </Suspense>
    </main>
  </div>;
}
