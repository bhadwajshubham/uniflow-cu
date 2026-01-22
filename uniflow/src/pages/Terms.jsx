import React from "react";

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-black mb-6">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last Updated: January 21, 2026
      </p>
      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          UniFlow-cu is an independent, third-party event management and coordination
          platform that provides technical tools for event discovery, registration,
          participation tracking, and attendance verification.
        </p>
        <p>
          UniFlow-cu is <strong>not an official system of any university or institution</strong>,
          unless explicitly stated in writing. Any reference to university-related
          events, clubs, or societies does not imply affiliation or endorsement.
        </p>

        <h2 className="text-lg font-bold mt-8">1. Acceptance of Terms</h2>
        <p>
          By accessing or using UniFlow-cu, you agree to be bound by these Terms & Conditions and our{" "}
          <a href="/privacy" className="underline hover:text-blue-600">Privacy Policy</a>. If you do not agree, you must not use the platform.
        </p>

        <h2 className="text-lg font-bold mt-8">2. Eligibility</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>You must be at least 18 years of age to use UniFlow-cu.</li>
          <li>Users between 13–18 years may use the platform only with verifiable parental/guardian consent.</li>
          <li>You are responsible for providing accurate and truthful information.</li>
        </ul>

        <h2 className="text-lg font-bold mt-8">3. Platform Role</h2>
        <p>
          UniFlow-cu acts solely as a technology provider. We do not organize, host, supervise, or control any events listed on the platform. All events are created and managed by independent organizers.
        </p>

        <h2 className="text-lg font-bold mt-8">4. User Accounts</h2>
        <p>
          You are responsible for maintaining account security and all actions performed through your account. UniFlow-cu may suspend or terminate accounts for violations.
        </p>

        <h2 className="text-lg font-bold mt-8">5. Data & Consent (DPDP Act Compliance)</h2>
        <p>
          By using UniFlow-cu, you provide explicit, informed, and granular consent for the collection and processing of your personal data under the Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>
        <p>Data collected (only what is necessary):</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Name, email address, phone number</li>
          <li>Roll number, branch, semester, group, residency status</li>
          <li>Optional profile photograph</li>
          <li>Event registrations, attendance status, QR scan records</li>
          <li>Responses to organizer-created questions (e.g., blood group, eligibility details)</li>
        </ul>
        <p>
          University data is shared only with organizers via Firebase Firestore and Cloudinary (for images), with your consent. You may withdraw consent at any time via support email or app settings (may limit or terminate access).
        </p>

        <h2 className="text-lg font-bold mt-8">6. Events & Registrations</h2>
        <p>
          Event details are provided by organizers. UniFlow-cu does not guarantee accuracy, availability, or execution of events.
        </p>

        <h2 className="text-lg font-bold mt-8">7. Refunds & Cancellations</h2>
        <p>
          Refunds are governed solely by the event organizer. UniFlow-cu only facilitates technical processing. No refunds for no-shows unless the organizer explicitly allows it.
        </p>

        <h2 className="text-lg font-bold mt-8">8. Organizer Responsibilities</h2>
        <p>
          Organizers are solely responsible for event execution, participant safety, institutional compliance, and lawful handling of any additional data they collect. Organizers confirm they have the legal authority to collect any additional participant information they request and are responsible for its lawful use.
        </p>

        <h2 className="text-lg font-bold mt-8">9. Third-Party Services</h2>
        <p>
          UniFlow-cu uses Firebase and other trusted providers. We are not liable for third-party outages, data loss, or breaches beyond our reasonable control.
        </p>

        <h2 className="text-lg font-bold mt-8">10. Security Disclaimer</h2>
        <p>
          We use industry-standard security measures, but no system is completely secure. UniFlow-cu is not responsible for any data breaches, losses, or unauthorized access beyond our reasonable control, including third-party (e.g., Firebase, Cloudinary) incidents.
        </p>

        <h2 className="text-lg font-bold mt-8">11. Limitation of Liability</h2>
        <p>
         UniFlow-cu shall not be liable for any indirect, incidental, or consequential damages arising from participation in events listed on the platform. UniFlow-cu acts solely as a technology facilitator and does not organize or control events. Participation in any event is voluntary, and any loss, injury, or dispute is the sole responsibility of the respective event organizer. This includes no liability for data breaches, event issues, or any other incidents arising from user, organizer, or third-party actions.
        </p>

        <h2 className="text-lg font-bold mt-8">12. Suspension & Termination</h2>
        <p>
          UniFlow-cu reserves the right to suspend or terminate access to protect platform integrity or comply with law.
        </p>

        <h2 className="text-lg font-bold mt-8">13. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India.


        </p>

        <h2 className="text-lg font-bold mt-8">14. Contact & Grievance Redressal</h2>
        <p>
          For queries, grievances, or data rights requests (access, correction, erasure, withdrawal), contact:
        </p>
        <p className="font-bold">📧 bhardwajshubham0777@gmail.com</p>
        <p>
          UniFlow-cu has not appointed a formal Data Protection Officer. Privacy-related requests and grievances may be raised at the contact email below.
   We aim to respond within 30 days as per DPDP Act requirements. If unresolved, you may appeal to India's Data Protection Board.
        </p>
      </section>
    </div>
  );
};

export default Terms;