import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { Metadata } from 'next';

// PROMPT TO GENERATE YOUR TERMS & SERVICES
// ---
// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://allsearch.io
// - Name: AllSearch
// - Contact information: hello@allsearch.io
// - Company: Tugulab Ltd. in collaboration with Dealshake Ltd.
// - Company legal address: United Kingdom
// - Description: Using Generative Engine Optimisation (GEO) analytics and personalised opportunities to rank into ChatGPT, Perplexity, Google AI Mode, and more.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email

// Please write a simple privacy policy for my site. Add the current date. Do not add or explain your reasoning.
// Answer writing in simple html styled with Tailwindcss classes
// ---

export const metadata: Metadata = getSEOTags({
  title: `Privacy Policy for ${config.appName}`,
  description: `Privacy Policy for ${config.appName}`,
});

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="py-6 text-3xl font-extrabold">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="mb-8 text-sm">Last Updated: December 11, 2025</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Introduction</h2>
          <p className="mb-4 leading-relaxed">
            Welcome to AllSearch (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are
            committed to protecting your personal information and your right to privacy. This
            Privacy Policy explains how we collect, use, and safeguard your information when you
            visit our website https://allsearch.io, operated by Tugulab Ltd. in collaboration with
            Dealshake Ltd. Our service provides Generative Engine Optimisation (GEO) analytics and
            personalised opportunities to help you rank into ChatGPT, Perplexity, Google AI Mode,
            and more.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Information We Collect</h2>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Personal Information</h3>
            <p className="mb-3">We collect the following personal information:</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Name</li>
              <li>Email address</li>
              <li>
                Payment information (processed securely through third-party payment processors)
              </li>
            </ul>
            <p className="mt-3">
              This information is collected when you create an account, make a purchase, or
              communicate with us.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Non-Personal Information</h3>
            <p className="mb-3">
              We automatically collect certain non-personal information through:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Web cookies and similar tracking technologies</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage patterns and analytics</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">How We Use Your Information</h2>
          <p className="mb-3">
            We collect and use your personal information solely for the following purposes:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <strong>Order Processing:</strong> To process your subscription payments and deliver
              our services
            </li>
            <li>
              <strong>Account Management:</strong> To create and manage your AllSearch account
            </li>
            <li>
              <strong>Communication:</strong> To send you service-related notifications, updates,
              and respond to your inquiries
            </li>
            <li>
              <strong>Service Improvement:</strong> To analyze usage patterns and improve our
              platform
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with applicable laws and regulations
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Data Sharing and Disclosure</h2>
          <p className="mb-4 leading-relaxed">
            We respect your privacy and do not sell, trade, rent, or share your personal information
            with any third parties for their marketing purposes.
          </p>
          <p className="mb-3">
            We may share your information only in the following limited circumstances:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <strong>Payment Processors:</strong> To process your subscription payments securely
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court order, or government
              regulation
            </li>
            <li>
              <strong>Business Protection:</strong> To protect our rights, property, or safety, or
              that of our users
            </li>
          </ul>
          <p className="mt-3">
            Any service providers we work with are bound by strict confidentiality agreements and
            are only permitted to use your data for the specific purposes we authorize.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Data Security</h2>
          <p className="mb-4 leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your
            personal information against unauthorized access, alteration, disclosure, or
            destruction. These measures include:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure server infrastructure</li>
            <li>Regular security assessments and updates</li>
            <li>Restricted access to personal information</li>
          </ul>
          <p className="mt-3">
            However, no method of transmission over the internet or electronic storage is 100%
            secure. While we strive to protect your personal information, we cannot guarantee
            absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Cookies and Tracking</h2>
          <p className="mb-4 leading-relaxed">
            We use cookies and similar tracking technologies to enhance your browsing experience,
            analyze website traffic, and understand user behavior. Cookies are small text files
            stored on your device.
          </p>
          <p className="mb-3">Types of cookies we use:</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <strong>Essential Cookies:</strong> Required for the website to function properly
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how visitors use our website
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings and preferences
            </li>
          </ul>
          <p className="mt-3">
            You can control cookie settings through your browser preferences. Note that disabling
            certain cookies may affect website functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Data Retention</h2>
          <p className="leading-relaxed">
            We retain your personal information only for as long as necessary to fulfill the
            purposes outlined in this Privacy Policy, including:
          </p>
          <ul className="mt-3 ml-4 list-inside list-disc space-y-1">
            <li>While your account is active</li>
            <li>To comply with legal obligations</li>
            <li>To resolve disputes and enforce our agreements</li>
          </ul>
          <p className="mt-3">
            When your data is no longer needed, we will securely delete or anonymize it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Children&apos;s Privacy</h2>
          <p className="leading-relaxed">
            Our services are not intended for children under 13 years of age. We do not knowingly
            collect, use, or disclose personal information from children under 13. If we become
            aware that we have collected personal information from a child under 13, we will take
            steps to delete such information promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Your Privacy Rights</h2>
          <p className="mb-3">
            Depending on your location, you may have the following rights regarding your personal
            information:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>
              <strong>Access:</strong> Request access to the personal information we hold about you
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete
              information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal information
            </li>
            <li>
              <strong>Data Portability:</strong> Request a copy of your data in a structured format
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Withdraw your consent for data processing at any
              time
            </li>
            <li>
              <strong>Object:</strong> Object to certain types of data processing
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at hello@allsearch.io. We will
            respond to your request within a reasonable timeframe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">International Data Transfers</h2>
          <p className="leading-relaxed">
            Your information may be transferred to and processed in countries other than your
            country of residence. These countries may have data protection laws that differ from
            those in your jurisdiction. We ensure appropriate safeguards are in place to protect
            your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Updates to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices
            or legal requirements. When we make material changes, we will notify you by email at the
            address associated with your account and update the &quot;Last Updated&quot; date at the
            top of this policy. We encourage you to review this Privacy Policy periodically to stay
            informed about how we protect your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Contact Information</h2>
          <p className="mb-3">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our
            data practices, please contact us at:
          </p>
          <div className="bg-tertiary rounded-lg px-4 py-1">
            <p className="font-semibold">Tugulab Ltd. in collaboration with Dealshake Ltd.</p>
            <p className="">Email: hello@allsearch.io</p>
            <p className="">Location: United Kingdom</p>
          </div>
        </section>

        <div className="bg-tertiary mt-12 rounded border-l-4 border-blue-400 px-4 py-1">
          <p className="font-medium">
            By using AllSearch, you acknowledge that you have read, understood, and agree to the
            collection, use, and disclosure of your information as described in this Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
