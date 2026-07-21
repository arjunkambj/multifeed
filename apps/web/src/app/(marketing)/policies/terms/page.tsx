import type { Metadata } from "next";

import { PolicyPage } from "@/components/marketing/policies/PolicyPage";
import {
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/components/marketing/policies/policy-links";

export const metadata: Metadata = {
  title: "Terms of Service | Multi Feed",
  description:
    "Terms governing access to and use of the Multi Feed social media management service.",
  alternates: { canonical: "/policies/terms" },
  openGraph: {
    title: "Terms of Service | Multi Feed",
    description: "The terms governing your use of Multi Feed.",
    url: "/policies/terms",
  },
};

export default function TermsPage() {
  return (
    <PolicyPage
      description="These Terms of Service govern your access to and use of Multi Feed. By creating an account, connecting a social profile, or using the service, you agree to these terms."
      title="Terms of Service"
    >
      <section>
        <h2>1. The service</h2>
        <p>
          Multi Feed, available at <a href={SITE_URL}>{SITE_URL}</a>, helps
          users and teams create, manage, schedule, publish, and review social
          media content across supported third-party platforms. Features may
          vary by plan, platform, region, account type, and third-party
          approval.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and accounts</h2>
        <p>
          You must be at least 18 years old and legally able to enter a binding
          agreement. You must provide accurate information, protect your account
          credentials, and promptly tell us about suspected unauthorized use.
          You are responsible for activity under your account and for ensuring
          that each person you invite to a workspace has appropriate authority.
        </p>
      </section>

      <section>
        <h2>3. Connected accounts and permissions</h2>
        <p>
          When you connect a social account, you authorize Multi Feed to access
          the data and perform the actions covered by the permissions you
          approve. This may include reading basic profile, Page, channel,
          content, engagement, inbox, or analytics information and uploading or
          publishing content at your direction. You represent that you have
          authority to connect and manage each account.
        </p>
        <p>
          You can withdraw this authorization by disconnecting the account from
          Multi Feed or revoking access in the platform&apos;s settings. Some
          features will stop working after access is revoked.
        </p>
      </section>

      <section>
        <h2>4. Your content</h2>
        <p>
          You retain ownership of content you submit. You grant Multi Feed a
          limited, worldwide, non-exclusive license to host, copy, process,
          adapt for technical requirements, transmit, and publish that content
          only as needed to operate the service and follow your instructions.
          This license ends when the content is deleted from Multi Feed, except
          where a copy must be retained by law or in a routine backup for a
          limited period.
        </p>
        <p>
          You are responsible for your content and must have all rights,
          licenses, permissions, and releases needed to use and publish it,
          including any rights relating to music, images, video, trademarks,
          advertising, and individuals shown in the content.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You may not use Multi Feed to:</p>
        <ul>
          <li>
            violate law, regulation, or a third-party platform&apos;s rules;
          </li>
          <li>
            publish unlawful, infringing, deceptive, abusive, harassing,
            exploitative, or harmful content;
          </li>
          <li>send spam or coordinate inauthentic or fraudulent activity;</li>
          <li>
            access an account, workspace, system, or data without authorization;
          </li>
          <li>
            disrupt, overload, scrape, probe, or circumvent security or usage
            limits of the service;
          </li>
          <li>
            reverse engineer or copy the service except where applicable law
            expressly permits it; or
          </li>
          <li>
            use the service to develop or train a competing product without our
            written permission.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Teams</h2>
        <p>
          Workspace owners and administrators control membership and access. If
          you use Multi Feed for an organization, you represent that you can
          bind that organization to these terms. Your organization may access,
          manage, export, or delete content and connected-account information in
          its workspace.
        </p>
      </section>

      <section>
        <h2>7. Plans, billing, and cancellation</h2>
        <p>
          Paid plans renew for the billing interval selected at checkout unless
          canceled. Prices, taxes, plan limits, trial terms, and billing dates
          are shown before purchase. You authorize our payment provider to
          charge the applicable amount. You may cancel before renewal to prevent
          the next recurring charge; access may continue through the paid
          period. Except where law requires otherwise or the checkout terms say
          otherwise, charges already paid are non-refundable.
        </p>
        <p>
          We may change future prices or plan features with reasonable advance
          notice. If payment fails, we may limit or suspend paid features.
        </p>
      </section>

      <section>
        <h2>8. Third-party platforms</h2>
        <p>
          Social networks, payment providers, and other integrations are
          operated by third parties under their own terms and policies. Their
          APIs, permissions, review decisions, rate limits, formats, and
          availability can change without our control. Multi Feed is not
          responsible for a third party&apos;s service, content, or decision to
          restrict an account or application. You must comply with each
          platform&apos;s applicable terms.
        </p>
      </section>

      <section>
        <h2>9. Our intellectual property</h2>
        <p>
          Multi Feed and its software, design, branding, and documentation are
          owned by us or our licensors and are protected by
          intellectual-property laws. These terms give you a limited, revocable,
          non-transferable right to use the service while your account is
          active; they do not transfer ownership of Multi Feed to you.
        </p>
      </section>

      <section>
        <h2>10. Service changes</h2>
        <p>
          We may update, add, remove, suspend, or discontinue features to
          improve the service, respond to platform or legal requirements,
          address security issues, or manage operations. We aim to provide
          reasonable notice when a material change negatively affects paid use,
          unless an urgent change is needed.
        </p>
      </section>

      <section>
        <h2>11. Suspension and termination</h2>
        <p>
          You may stop using Multi Feed at any time. We may suspend or terminate
          access if you materially breach these terms, create risk or harm, fail
          to pay applicable fees, or if law or a platform requires us to do so.
          Where reasonable, we will provide notice and an opportunity to correct
          the issue. Provisions that by their nature should survive termination
          will remain in effect.
        </p>
      </section>

      <section>
        <h2>12. Disclaimers</h2>
        <p>
          To the fullest extent permitted by law, Multi Feed is provided “as is”
          and “as available.” We disclaim implied warranties of merchantability,
          fitness for a particular purpose, non-infringement, and uninterrupted
          or error-free operation. We do not guarantee that a third-party
          platform will accept, publish, retain, or distribute content at a
          particular time or to a particular audience.
        </p>
      </section>

      <section>
        <h2>13. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Multi Feed and its operators,
          affiliates, and service providers will not be liable for indirect,
          incidental, special, exemplary, consequential, or punitive damages, or
          for lost profits, revenue, data, goodwill, or business interruption.
          Our total liability for claims relating to the service will not exceed
          the amount you paid to Multi Feed during the 12 months before the
          event giving rise to the claim. These limits do not apply where
          prohibited by law.
        </p>
      </section>

      <section>
        <h2>14. Changes to these terms</h2>
        <p>
          We may update these terms. We will post the revised version, change
          the effective date, and provide additional notice where required. By
          continuing to use Multi Feed after revised terms take effect, you
          agree to them. If you do not agree, you must stop using the service.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </PolicyPage>
  );
}
