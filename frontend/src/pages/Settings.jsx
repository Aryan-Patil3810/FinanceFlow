
import { useEffect, useState } from "react";

import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  ShieldCheck,
  UserRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { usePreferences } from "../context/PreferencesContext";

// Country options
const countryOptions = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
];

// Currency options
const currencyOptions = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
];

// Timezone options
const timeZoneOptions = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

// Date format options
const dateFormatOptions = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

// Default preferences
const defaultPreferences = {
  country: "IN",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  locale: "en-IN",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12H",
};

const Settings = () => {
  // Global preferences context
  const {
    preferences: globalPreferences,
    loading,
    saving,
    error: preferencesError,
    savePreferences,
  } = usePreferences();

  const [activeSection, setActiveSection] = useState("regional");

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [savedPreferences, setSavedPreferences] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync local form state with global preferences
  useEffect(() => {
    if (loading || preferencesError) return;

    const loadedPreferences = {
      country: globalPreferences.countryCode,
      currency: globalPreferences.displayCurrency,
      timeZone: globalPreferences.timeZone,
      locale: globalPreferences.locale,
      dateFormat: globalPreferences.dateFormat,
      timeFormat: globalPreferences.timeFormat,
    };

    setPreferences(loadedPreferences);
    setSavedPreferences(loadedPreferences);
    setError("");
  }, [loading, preferencesError, globalPreferences]);

  // Update individual preference
  const updatePreference = (key, value) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSuccess("");
    setError("");
  };

  // Detect unsaved changes
  const hasChanges =
    savedPreferences !== null &&
    Object.keys(preferences).some(
      (key) => preferences[key] !== savedPreferences[key]
    );

  // Save preferences through global context
  const handleSavePreferences = async () => {
    if (!hasChanges || saving || loading) return;

    try {
      setError("");
      setSuccess("");

      const request = {
        countryCode: preferences.country,
        displayCurrency: preferences.currency,
        timeZone: preferences.timeZone,
        locale: preferences.locale,
        dateFormat: preferences.dateFormat,
        timeFormat: preferences.timeFormat,
      };

      // Saves to backend and updates global context
      const saved = await savePreferences(request);

      const updatedPreferences = {
        country: saved.countryCode,
        currency: saved.displayCurrency,
        timeZone: saved.timeZone,
        locale: saved.locale,
        dateFormat: saved.dateFormat,
        timeFormat: saved.timeFormat,
      };

      setPreferences(updatedPreferences);
      setSavedPreferences(updatedPreferences);

      setSuccess("Your preferences have been saved successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save preferences. Please try again."
      );
    }
  };

  // Settings sections
  const sections = [
    {
      id: "profile",
      title: "Profile",
      description: "Manage your personal information",
      icon: UserRound,
    },
    {
      id: "regional",
      title: "Regional Preferences",
      description: "Currency, timezone and date formats",
      icon: Globe,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage your alerts and reminders",
      icon: Bell,
    },
    {
      id: "security",
      title: "Security",
      description: "Account security and privacy",
      icon: ShieldCheck,
    },
  ];

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  const displayedError = error || preferencesError;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2.5 text-white">
              <SettingsIcon size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Settings
              </h1>

              <p className="text-sm text-slate-500">
                Manage your FinanceFlow preferences
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  setError("");
                  setSuccess("");
                }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Icon
                    size={19}
                    className={
                      isActive ? "text-white" : "text-slate-500"
                    }
                  />

                  {isActive && (
                    <CheckCircle2
                      size={16}
                      className="text-white"
                    />
                  )}
                </div>

                <h3 className="text-sm font-semibold">
                  {section.title}
                </h3>

                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isActive ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Regional Preferences */}
        {activeSection === "regional" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Regional Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customize how dates, times and currencies appear
                throughout FinanceFlow.
              </p>
            </div>

            <div className="space-y-6 p-6">

              {/* Loading */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={25}
                    className="animate-spin text-slate-500"
                  />

                  <span className="ml-3 text-sm text-slate-500">
                    Loading your preferences...
                  </span>
                </div>
              ) : (
                <>
                  {/* Country and Currency */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                    <div>
                      <label className={labelClass}>
                        Country / Region
                      </label>

                      <select
                        value={preferences.country}
                        onChange={(e) =>
                          updatePreference("country", e.target.value)
                        }
                        className={selectClass}
                        disabled={Boolean(preferencesError)}
                      >
                        {countryOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Your preferred country or region.
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Display Currency
                      </label>

                      <select
                        value={preferences.currency}
                        onChange={(e) =>
                          updatePreference("currency", e.target.value)
                        }
                        className={selectClass}
                        disabled={Boolean(preferencesError)}
                      >
                        {currencyOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Currency used for displaying amounts.
                      </p>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className={labelClass}>
                      Time Zone
                    </label>

                    <select
                      value={preferences.timeZone}
                      onChange={(e) =>
                        updatePreference("timeZone", e.target.value)
                      }
                      className={selectClass}
                      disabled={Boolean(preferencesError)}
                    >
                      {timeZoneOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Used for displaying dates and scheduling reminders.
                    </p>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className={labelClass}>
                      Date Format
                    </label>

                    <select
                      value={preferences.dateFormat}
                      onChange={(e) =>
                        updatePreference("dateFormat", e.target.value)
                      }
                      className={selectClass}
                      disabled={Boolean(preferencesError)}
                    >
                      {dateFormatOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className={labelClass}>
                      Time Format
                    </label>

                    <div className="flex gap-3">
                      {["12H", "24H"].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() =>
                            updatePreference("timeFormat", format)
                          }
                          disabled={Boolean(preferencesError)}
                          className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            preferences.timeFormat === format
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {format === "12H" ? "12-hour" : "24-hour"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Messages */}
                  {displayedError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>{displayedError}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>{success}</span>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-slate-400">
                      {hasChanges
                        ? "You have unsaved changes."
                        : "Your preferences are up to date."}
                    </p>

                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      disabled={
                        !hasChanges ||
                        saving ||
                        loading ||
                        Boolean(preferencesError)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}

                      {saving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Other Settings Sections */}
        {activeSection !== "regional" && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              {activeSection === "profile" && (
                <UserRound
                  size={22}
                  className="text-slate-600"
                />
              )}

              {activeSection === "notifications" && (
                <Bell
                  size={22}
                  className="text-slate-600"
                />
              )}

              {activeSection === "security" && (
                <ShieldCheck
                  size={22}
                  className="text-slate-600"
                />
              )}
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              {sections.find(
                (item) => item.id === activeSection
              )?.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This section will be available in a future FinanceFlow update.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;