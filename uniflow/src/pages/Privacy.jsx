import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-black mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last Updated: January 21, 2026
      </p>

      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          UniFlow (“we”, “our”, “us”) is committed to protecting your privacy. This Privacy Policy, compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act) and other applicable laws, explains our data practices. By using UniFlow, you consent to these practices.
        </p>

        <h2 className="text-lg font-bold mt-8">1. Information We Collect</h2>
        <p>
          We collect minimal necessary data (data minimization under DPDP Act) to provide and improve services.
        </p>
        <h3 className="font-semibold">A. Information You Provide</h3>
        <ul className="list-disc ml-6 space-y-1">
          <li>Full name, email, phone number</li>
          <li>Roll number / enrollment ID, branch, semester, academic group</li>
          <li>Residency status (e.g., day scholar / hosteller)</li>
          <li>Optional profile photo</li>
          <li>Event registrations and attendance data</li>
          <li>Responses to organizer questions (e.g., blood group, weight)</li>
        </ul>
        <h3 className="font-semibold">B. Authentication Data</h3>
        <p>
          Via secure providers (e.g., Firebase): User ID, email verification, login timestamps. Passwords are never stored.
        </p>
        <h3 className="font-semibold">C. Event & Activity Data</h3>
        <ul className="list-disc ml-6 space-y-1">
          <li>Events viewed/registered</li>
          <li>Ticket details, QR codes</li>
          <li>Attendance/check-in status</li>
        </ul>
        <h3 className="font-semibold">D. Automatically Collected Data</h3>
        <ul className="list-disc ml-6 space-y-1">
          <li>Device/browser type, IP address (for security)</li>
          <li>Usage timestamps</li>
        </ul>

        <h2 className="text-lg font-bold mt-8">2. How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Account management and authentication</li>
          <li>Event registration and verification</li>
          <li>Notifications and communications</li>
          <li>Platform improvement and analytics</li>
          <li>Fraud prevention and security</li>
          <li>Legal compliance</li>
        </ul>
        <p>We do not sell or rent your data.</p>

        <h2 className="text-lg font-bold mt-8">3. Consent & Legal Basis (DPDP Compliance)</h2>
        <p>
          Processing is based on your explicit, informed consent (verifiable under DPDP Act), contractual necessity, or legitimate interests. Consent is granular and withdrawable without affecting prior processing.
        </p>

        <h2 className="text-lg font-bold mt-8">4. Data Storage & Security</h2>
        <p>
          Data is stored on secure, India-compliant cloud servers with encryption (at rest and in transit). We notify breaches per DPDP Act requirements.
        </p>

        <h2 className="text-lg font-bold mt-8">5. Third-Party Services</h2>
        <p>
          We use Firebase (authentication/storage) and others. They comply with DPDP; we’re not liable for their independent failures.
        </p>

        <h2 className="text-lg font-bold mt-8">6. Data Sharing</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>With organizers (only necessary data, with your consent)</li>
          <li>Service providers (under strict contracts)</li>
          <li>Legal requirements</li>
        </ul>

        <h2 className="text-lg font-bold mt-8">7. Data Retention</h2>
        <p>
          Retained while active; up to 2 years post-deletion for legal/audit purposes, then deleted or anonymized.
        </p>

        <h2 className="text-lg font-bold mt-8">8. Your Rights (DPDP Act)</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Access, correct, or erase data</li>
          <li>Withdraw consent</li>
          <li>Data portability</li>
          <li>Nominate a data heir</li>
          <li>File grievances</li>
        </ul>
        <p>Requests via support email; responded within 30 days.</p>

        <h2 className="text-lg font-bold mt-8">9. Account Deletion</h2>
        <p>
          Upon deletion, access ends. Some anonymized records retained for compliance.
        </p>

        <h2 className="text-lg font-bold mt-8">10. Children’s Privacy</h2>
        <p>
          Not for under 13. Under 18 requires verifiable parental consent per DPDP Act.
        </p>

        <h2 className="text-lg font-bold mt-8">11. Changes to Policy</h2>
        <p>
          Updates notified via platform/email. Continued use is acceptance.
        </p>

        <h2 className="text-lg font-bold mt-8">12. Disclaimer</h2>
        <p>
          UniFlow is a facilitator; not liable for organizer data misuse or inaccuracies.
        </p>

        <h2 className="text-lg font-bold mt-8">13. Contact</h2>
        <p className="font-bold">📧 bhardwajshubham0777@gmail.com</p>
        <p>For DPDP grievances, contact our DPO at the above email.</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;