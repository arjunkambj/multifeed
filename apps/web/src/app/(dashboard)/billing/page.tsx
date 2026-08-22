import type { Metadata } from "next";
import { BillingPage } from "@/components/billing/BillingPage";

export const metadata: Metadata = {
  title: "Billing",
};

export default function BillingRoute() {
  return <BillingPage />;
}
