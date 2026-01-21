import React from "react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Terms & Conditions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Please read these terms carefully before using UniFlow.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What UniFlow Is
            </h2>
            <p>
              UniFlow is an independent, third-party event management platform
              that provides tools for event registration, participation tracking,
              and attendance verification.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Our Role
            </h2>
            <p>
              UniFlow acts solely as a technology provider. Events are created
              and managed by independent organizers such as clubs, societies,
              or authorized individuals.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Accounts & Access
            </h2>
            <p>
              You are responsible for activities performed using your account.
              UniFlow may suspend or restrict access in case of misuse or policy
              violations.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Tickets & Entry
            </h2>
            <p>
              Tickets are intended for individual use. Entry is typically
              granted on a first-successful-scan basis, subject to organizer
              rules.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Service Availability & Security
            </h2>
            <p>
              UniFlow is provided on an “as-is” basis. While reasonable security
              practices are applied, uninterrupted availability or absolute
              security cannot be guaranteed.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Legal
            </h2>
            <p>
              These terms are governed by the laws of India.
            </p>
          </section>

          <section>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Questions? Contact{" "}
              <a
                href="mailto:bhardwajshubham0777@gmail.com"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                bhardwajshubham0777@gmail.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
