import type { Metadata } from "next";
import { TeamSection } from "@/components/team/TeamSection";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamsPage() {
  return <TeamSection />;
}
