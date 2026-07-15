import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Multi Feed",
  description: "Terms governing your use of Multi Feed.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service govern your access to and use of Multi Feed. By
        creating an account or using the service, you agree to these terms.
      </p>

      <section>
        <h2>Using Multi Feed</h2>
        <p>
          You must be able to enter a binding agreement where you live and must
          provide accurate account information. You are responsible for your
          account, connected social accounts, and activity performed through
          them.
        </p>
      </section>

      <section>
        <h2>Your content and connected accounts</h2>
        <p>
          You keep ownership of the content you submit. You give Multi Feed the
          limited permission needed to store, process, adapt, schedule, and
          publish that content according to your instructions. Connecting a
          social account authorizes us to access and use the permissions you
          approve, including publishing to that account when you ask us to.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You may not use Multi Feed to:</p>
        <ul>
          <li>break the law or another platform&apos;s rules;</li>
          <li>publish content you do not have the right to use;</li>
          <li>harass, deceive, spam, or harm another person;</li>
          <li>interfere with the service or attempt unauthorized access; or</li>
          <li>reverse engineer or misuse the service except where law permits.</li>
        </ul>
      </section>

      <section>
        <h2>Third-party platforms</h2>
        <p>
          Multi Feed works with services such as TikTok and other social
          networks. Their terms, availability, review processes, and technical
          limits also apply. We are not responsible for changes, restrictions,
          or actions taken by those third-party services.
        </p>
      </section>

      <section>
        <h2>Service changes and termination</h2>
        <p>
          We may improve, change, suspend, or discontinue features. You may stop
          using the service at any time. We may suspend or terminate access when
          these terms are violated, the service is at risk, or the law requires
          it.
        </p>
      </section>

      <section>
        <h2>Disclaimers and liability</h2>
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the
          extent permitted by law. We do not guarantee uninterrupted publishing
          or third-party platform availability. To the maximum extent permitted
          by law, Multi Feed is not liable for indirect, incidental, special, or
          consequential losses arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:support@themultifeed.com">
            support@themultifeed.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
