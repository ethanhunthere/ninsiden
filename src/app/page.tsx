import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { PipelinePreview } from "@/components/home/PipelinePreview";
import { ProductSections } from "@/components/home/ProductSections";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "NInsideN — See AI From The Inside",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PipelinePreview />
      <ProductSections />
      <CTASection />
    </>
  );
}
