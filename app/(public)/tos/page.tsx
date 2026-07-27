import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { Metadata } from 'next';
import Link from 'next/link';

// PROMPT TO GENERATE YOUR TERMS & SERVICES
// ---
// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://allsearch.io
// - Name: AllSearch
// - Contact information: hello@allsearch.io
// - Company: Tugulab Ltd. in collaboration with Dealshake Ltd.
// - Company legal address: United Kingdom
// - Description: Using Generative Engine Optimisation (GEO) analytics and personalised opportunities to rank into ChatGPT, Perplexity, Google AI Mode, and more.
// - Ownership: when a user buys a subscription they have access to their content through AllSearch until their subscription expires; a user can ask a refund within 7 days after the purchase;
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://allsearch.io/privacy-policy
// - Governing Law: United Kingdom
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning.
// Answer writing in simple html styled with Tailwindcss classes
// ---

export const metadata: Metadata = getSEOTags({
  title: `Terms and Conditions details for ${config.appName}`,
  description: `Terms and Conditions details for ${config.appName}`,
});

export default function TOSPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="py-6 text-3xl font-extrabold">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <div className="mb-6 text-sm">Last Updated: December 11, 2025</div>

        <h2 className="mb-4 text-2xl font-bold">1. Introduction</h2>
        <p className="mb-4">
          Welcome to AllSearch. These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of the AllSearch website and services available at https://allsearch.io
          (&quot;Service&quot;), operated by Tugulab Ltd. in collaboration with Dealshake Ltd.
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        </p>
        <p className="mb-6">
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree
          with any part of the Terms, you may not access the Service.
        </p>

        <h2 className="mb-4 text-2xl font-bold">2. Description of Services</h2>
        <p className="mb-6">
          AllSearch provides Generative Engine Optimisation (GEO) analytics and personalised
          opportunities to help you rank into ChatGPT, Perplexity, Google AI Mode, and other AI
          search platforms. Our Service provides tools and insights to optimize your content for
          generative AI search engines.
        </p>

        <h2 className="mb-4 text-2xl font-bold">3. User Accounts and Responsibilities</h2>
        <p className="mb-4">
          When you create an account with us, you must provide accurate, complete, and current
          information. Failure to do so constitutes a breach of the Terms, which may result in
          immediate termination of your account.
        </p>
        <p className="mb-6">
          You are responsible for safeguarding the password used to access the Service and for any
          activities or actions under your account. You agree not to use the Service for any
          unlawful purpose or to engage in any activity that could harm the Service, other users, or
          third parties.
        </p>

        <h2 className="mb-4 text-2xl font-bold">4. Subscription and Payment</h2>
        <p className="mb-4">
          When you purchase a subscription, you will have access to your content through AllSearch
          until your subscription expires. Your subscription grants you a limited, non-exclusive,
          non-transferable right to access and use the Service during the active subscription
          period.
        </p>
        <p className="mb-6">
          By completing a purchase, you authorize our payment processor to charge your selected
          payment method for the applicable subscription fees and taxes. All fees are non-refundable
          except as expressly stated in our Refund Policy.
        </p>

        <h2 className="mb-4 text-2xl font-bold">5. Refund Policy</h2>
        <p className="mb-6">
          You may request a refund within 7 days after your purchase. Refund requests should be sent
          to hello@allsearch.io. We will process valid refund requests within a reasonable
          timeframe. After the 7-day period, all payments are final and non-refundable.
        </p>

        <h2 className="mb-4 text-2xl font-bold">6. Intellectual Property</h2>
        <p className="mb-4">
          The Service and its original content, features, and functionality are owned by Tugulab
          Ltd. and Dealshake Ltd. and are protected by international copyright, trademark, patent,
          trade secret, and other intellectual property laws.
        </p>
        <p className="mb-6">
          You are granted a limited, non-exclusive, non-transferable license to access and use the
          Service for your business or personal use only, subject to these Terms. You may not copy,
          modify, distribute, sell, or lease any part of our Service without our prior written
          consent.
        </p>

        <h2 className="mb-4 text-2xl font-bold">7. Data Collection and Privacy</h2>
        <p className="mb-4">We collect the following data:</p>
        <ul className="mb-4 list-disc pl-6">
          <li>Personal data: name, email, and payment information</li>
          <li>Non-personal data: web cookies for website functionality and analytics</li>
        </ul>
        <p className="mb-6">
          For complete details on how we collect, use, and protect your data, please review our{' '}
          <Link href="/privacy-policy" className="link">
            Privacy Policy
          </Link>
          .
        </p>

        <h2 className="mb-4 text-2xl font-bold">8. User Content and Conduct</h2>
        <p className="mb-4">
          You retain ownership of any content you submit to the Service. By submitting content, you
          grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and process
          your content solely for the purpose of providing the Service to you.
        </p>
        <p className="mb-6">
          You agree not to use the Service to transmit any unlawful, harmful, threatening, abusive,
          harassing, defamatory, or otherwise objectionable material, or to violate any applicable
          laws or regulations.
        </p>

        <h2 className="mb-4 text-2xl font-bold">9. Limitation of Liability</h2>
        <p className="mb-4">
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
          of any kind, either express or implied, including but not limited to warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p className="mb-6">
          To the maximum extent permitted by law, we shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, including but not limited to loss
          of profits, data, or other intangible losses, resulting from your use of or inability to
          use the Service.
        </p>

        <h2 className="mb-4 text-2xl font-bold">10. Indemnification</h2>
        <p className="mb-6">
          You agree to indemnify, defend, and hold harmless Tugulab Ltd., Dealshake Ltd., and their
          respective officers, directors, employees, and agents from any claims, damages,
          obligations, losses, liabilities, costs, or expenses arising from your use of the Service
          or violation of these Terms.
        </p>

        <h2 className="mb-4 text-2xl font-bold">11. Termination</h2>
        <p className="mb-4">
          We may terminate or suspend your account and access to the Service immediately, without
          prior notice or liability, for any reason, including without limitation if you breach
          these Terms.
        </p>
        <p className="mb-6">
          Upon termination, your right to use the Service will immediately cease. All provisions of
          these Terms which by their nature should survive termination shall survive, including
          ownership provisions, warranty disclaimers, and limitations of liability.
        </p>

        <h2 className="mb-4 text-2xl font-bold">12. Governing Law and Dispute Resolution</h2>
        <p className="mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the United
          Kingdom, without regard to its conflict of law provisions.
        </p>
        <p className="mb-6">
          Any disputes arising out of or relating to these Terms or the Service shall be resolved
          through good faith negotiations. If negotiations fail, disputes shall be subject to the
          exclusive jurisdiction of the courts of the United Kingdom.
        </p>

        <h2 className="mb-4 text-2xl font-bold">13. Changes to Terms</h2>
        <p className="mb-6">
          We reserve the right to modify or replace these Terms at any time at our sole discretion.
          If a revision is material, we will provide at least 30 days&apos; notice via email prior
          to any new terms taking effect. What constitutes a material change will be determined at
          our sole discretion. By continuing to access or use our Service after those revisions
          become effective, you agree to be bound by the revised terms.
        </p>

        <h2 className="mb-4 text-2xl font-bold">14. Severability</h2>
        <p className="mb-6">
          If any provision of these Terms is held to be unenforceable or invalid, such provision
          will be changed and interpreted to accomplish the objectives of such provision to the
          greatest extent possible under applicable law, and the remaining provisions will continue
          in full force and effect.
        </p>

        <h2 className="mb-4 text-2xl font-bold">15. Entire Agreement</h2>
        <p className="mb-6">
          These Terms constitute the entire agreement between you and us regarding the Service and
          supersede all prior agreements and understandings, whether written or oral, regarding the
          subject matter herein.
        </p>

        <h2 className="mb-4 text-2xl font-bold">16. Contact Us</h2>
        <p className="mb-2">If you have any questions about these Terms, please contact us at:</p>
        <div className="bg-tertiary rounded-lg px-4 py-1">
          <p className="font-semibold">Tugulab Ltd. in collaboration with Dealshake Ltd.</p>
          <p className="">Email: hello@allsearch.io</p>
          <p className="">Location: United Kingdom</p>
        </div>

        <div className="bg-tertiary mt-12 rounded border-l-4 border-blue-400 px-4 py-1">
          <p className="font-medium">
            By using AllSearch, you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service.
          </p>
        </div>
      </div>
    </main>
  );
}
