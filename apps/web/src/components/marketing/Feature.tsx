import Reveal from "@/components/motion/Reveal";
import Image from "next/image";

import { featureItems } from "@/constants/landing-page";
import {
  BODY,
  CARD_PADDING,
  GRID_GAP,
  HEADER_GAP,
  PANEL_HEADING,
} from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

export function Features() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Features"
        title="Create once."
        titleMuted="Tailor every channel."
        description="Move from first draft to scheduled post without copying, pasting, or losing track of what goes live next."
      />

      <Reveal
        className={`${HEADER_GAP} ${GRID_GAP} grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-3`}
      >
        {featureItems.map((item) => (
          <FeatureCard item={item} key={item.heading} />
        ))}
      </Reveal>
    </Section>
  );
}

function FeatureCard({ item }: { item: (typeof featureItems)[number] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card bg-secondary">
      <Image
        alt={item.heading}
        className="aspect-[16/10] w-full object-cover"
        height={224}
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        src="/hero-main.png"
        width={672}
      />
      <div className={CARD_PADDING}>
        <h3 className={PANEL_HEADING}>{item.heading}</h3>
        <p className={`mt-3 text-muted-foreground ${BODY}`}>
          {item.description}
        </p>
      </div>
    </div>
  );
}
