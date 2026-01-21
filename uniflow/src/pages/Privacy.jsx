import React from "react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            How UniFlow collects and handles your data.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Information We Collect
            </h2>
            <p>
              We may collect your name, email, event registrations, attendance
              status, and responses to event-specific forms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Storage & Security
            </h2>
            <p>
              Data is stored using secure cloud infrastructure, including Google
              Firebase, following industry-standard practices.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access & Responsibility
            </h2>
            <p>
              Data is accessible only to authorized administrators and event
              organizers. Organizers are responsible for lawful handling of
              participant data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Retention
            </h2>
            <p>
              Event-related data is retained only for a limited period and
              removed when no longer required.
            </p>
          </section>

          <section>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For privacy questions, contact{" "}
              <a
                href="mailto:uniflow.support@gmail.com"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                uniflow.support@gmail.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
