import Reveal from "@/components/motion/Reveal";
import { cn } from "@multifeed/ui/lib/utils";
import { BODY, EYEBROW, SECTION_HEADING } from "./rhythm";

type SectionHeaderProps = {
  /** Small label above the heading, preceded by a brand rule. */
  eyebrow: string;
  /** First heading line — rendered in foreground. */
  title: string;
  /** Second heading line — rendered muted, for the question/answer cadence. */
  titleMuted?: string;
  /** Supporting copy below the heading. */
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  titleMuted,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "w-full min-w-0 max-w-2xl",
        centered ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2.5",
          EYEBROW,
          centered && "justify-center",
        )}
      >
        <span className="h-1.25 w-2.5 shrink-0 rounded-full bg-muted-foreground" />
        {eyebrow}
      </p>

      <h2 className={cn(SECTION_HEADING, "mt-4 w-full")}>
        {title}
        {titleMuted && (
          <span className="block font-normal text-muted-foreground">
            {titleMuted}
          </span>
        )}
      </h2>

      {description && (
        <p
          className={cn(
            BODY,
            "mt-5 text-muted-foreground md:text-base md:leading-8",
            !centered && "max-w-xl",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
