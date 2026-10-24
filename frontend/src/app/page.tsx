import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LineageTable } from "@/components/LineageTable";
import { HowItWorks } from "@/components/HowItWorks";
import { ChannelsConfig } from "@/components/ChannelsConfig";
import { InstallSection } from "@/components/InstallSection";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-(--bg-primary)">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LineageTable />
        <HowItWorks />
        <ChannelsConfig />
        <InstallSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
