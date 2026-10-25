import { Banner } from "@/components/Banner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { EverythingYouNeed } from "@/components/EverythingYouNeed";
import { ModelsAndInfra } from "@/components/ModelsAndInfra";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { Testimonials } from "@/components/Testimonials";
import { FaqSection } from "@/components/FaqSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffef2] text-[#191918]">
      <Banner />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <EverythingYouNeed />
        <ModelsAndInfra />
        <FeaturesGrid />
        <Testimonials />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
