import {
  FeaturesSection,
  FinalCta,
  HeroSection,
  ModulesSection,
  PricingCards,
  SectionHeading,
  SocialProofSection,
} from "@/components/public/marketing-sections";
import { PublicShell } from "@/components/public/public-shell";

export default function Home() {
  return (
    <PublicShell>
      <HeroSection />
      <ModulesSection />
      <FeaturesSection />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Pricing preview"
            title="Start simple, then grow into warehouse-scale operations."
            description="Static pricing cards for the public site. Billing and plan enforcement will come after the backend foundation is ready."
          />
        </div>
        <PricingCards compact />
      </section>
      <SocialProofSection />
      <FinalCta />
    </PublicShell>
  );
}
