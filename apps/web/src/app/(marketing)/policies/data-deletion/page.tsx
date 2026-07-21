import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage } from "@/components/marketing/policies/PolicyPage";
import { SUPPORT_EMAIL } from "@/components/marketing/policies/policy-links";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Multi Feed",
  description:
    "How to disconnect social accounts or request deletion of a Multi Feed account and personal data.",
  alternates: { canonical: "/policies/data-deletion" },
  openGraph: {
    title: "Data Deletion Instructions | Multi Feed",
    description:
      "Disconnect an integration or request deletion of your Multi Feed data.",
    url: "/policies/data-deletion",
  },
};

export default function DataDeletionPage() {
  return (
    <PolicyPage
      description="You can remove a connected social account without closing your workspace, or ask us to delete your full Multi Feed account and personal data."
      title="Data Deletion Instructions"
    >
      <section>
        <h2>Disconnect one social account</h2>
        <ol>
          <li>Sign in to Multi Feed.</li>
          <li>
            Open <Link href="/connections">Connections</Link>.
          </li>
          <li>
            Find the connected profile and select the disconnect button beside
            its username.
          </li>
          <li>Confirm that you want to disconnect it.</li>
        </ol>
        <p>
          Disconnecting deletes the OAuth access credentials and
          connected-account record stored by Multi Feed. It also stops future
          access through that connection. Posts already published to the social
          platform remain there until you delete them on that platform.
        </p>
      </section>

      <section>
        <h2>Revoke access at the platform</h2>
        <p>
          You can also open the security or connected-app settings for Facebook,
          Instagram, Threads, LinkedIn, TikTok, Google/YouTube, or X and revoke
          Multi Feed. Revoking access prevents future API access, but it may not
          remove information previously stored in Multi Feed. To remove that
          information too, disconnect the account in Multi Feed or submit the
          deletion request below.
        </p>
      </section>

      <section>
        <h2>Delete your full Multi Feed account and data</h2>
        <ol>
          <li>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from
            the email address associated with your Multi Feed account.
          </li>
          <li>Use the subject “Delete my Multi Feed account.”</li>
          <li>
            Include the name of your workspace and state whether you want to
            delete only your user profile or a workspace you own.
          </li>
          <li>
            Complete any reasonable identity or workspace-ownership verification
            we request to protect your data.
          </li>
        </ol>
        <p>
          We will acknowledge your request and complete verified deletion within
          30 days unless a longer period is permitted or required by law. We
          will email you when the request is complete.
        </p>
      </section>

      <section>
        <h2>What full deletion covers</h2>
        <p>
          Subject to your role and workspace permissions, deletion includes:
        </p>
        <ul>
          <li>your Multi Feed profile and workspace membership;</li>
          <li>
            connected social-profile data, granted permissions, and encrypted
            access and refresh tokens;
          </li>
          <li>
            drafts, schedules, uploaded media, publishing records, and related
            inbox or analytics data owned by a workspace being deleted; and
          </li>
          <li>support data that is no longer needed.</li>
        </ul>
        <p>
          We may retain limited billing, transaction, security,
          fraud-prevention, or legal records when required or permitted by law.
          Residual copies may remain in protected backups until those backups
          expire. Data belonging to a shared workspace may remain available to
          its other authorized members when you request deletion only of your
          individual profile.
        </p>
      </section>

      <section>
        <h2>Need help?</h2>
        <p>
          Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with
          “Data Deletion Help” in the subject line. Never send a social-platform
          password or OAuth token by email.
        </p>
      </section>
    </PolicyPage>
  );
}
