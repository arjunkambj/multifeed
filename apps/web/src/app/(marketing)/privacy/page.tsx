import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Multi Feed",
  description: "How Multi Feed collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains how Multi Feed collects, uses, shares, and
        protects information when you use our website and social media
        management service.
      </p>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>account details such as your name, email address, and team;</li>
          <li>
            social account data you authorize, such as profile identifiers,
            display names, avatars, and granted permissions;
          </li>
          <li>content, media, captions, schedules, and publishing results;</li>
          <li>billing and subscription records from our payment provider; and</li>
          <li>
            device, log, diagnostic, and usage information needed to operate and
            secure the service.
          </li>
        </ul>
      </section>

      <section>
        <h2>TikTok data</h2>
        <p>
          When you connect TikTok, Multi Feed receives only the data and
          permissions you approve through TikTok&apos;s authorization screen. We use
          that access to identify the connected profile and to upload or publish
          content at your direction. We do not sell TikTok user data.
        </p>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>provide, personalize, and maintain Multi Feed;</li>
          <li>connect accounts and carry out requested publishing actions;</li>
          <li>process subscriptions and communicate about the service;</li>
          <li>prevent abuse, protect accounts, and troubleshoot problems; and</li>
          <li>comply with legal obligations and enforce our terms.</li>
        </ul>
      </section>

      <section>
        <h2>How we share information</h2>
        <p>
          We share information only with service providers that help us operate
          Multi Feed, with social platforms when carrying out your instructions,
          when required by law, or during a business transaction subject to
          appropriate safeguards. We do not sell personal information.
        </p>
      </section>

      <section>
        <h2>Retention and security</h2>
        <p>
          We keep information only as long as needed for the purposes described
          here, including legal, accounting, and security requirements. We use
          reasonable technical and organizational safeguards, but no online
          service can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can disconnect a social account to stop future access, and you can
          request access, correction, export, or deletion of your personal data.
          Some information may be retained where the law requires it. You can
          also revoke Multi Feed directly from the connected platform&apos;s account
          settings.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Multi Feed is not directed to children, and we do not knowingly
          collect personal information from children below the minimum legal age
          in their location.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy questions and data requests can be sent to{" "}
          <a href="mailto:support@themultifeed.com">
            support@themultifeed.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
