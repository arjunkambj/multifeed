import { redirect } from "next/navigation";

import { CreateOrganizationForm } from "@/components/team/CreateOrganizationForm";
import { hexclaveServerApp } from "@/hexclave/server";

export default async function CreateOrganizationPage() {
  const user = await hexclaveServerApp.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.selectedTeam) {
    redirect("/overview");
  }

  return <CreateOrganizationForm />;
}
