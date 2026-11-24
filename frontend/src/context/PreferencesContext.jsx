
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/userPreferencesService";

const PreferencesContext = createContext(null);

const DEFAULT_PREFERENCES = {
  countryCode: "IN",
  displayCurrency: "INR",
  timeZone: "Asia/Kolkata",
  locale: "en-IN",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12H",
};

export function PreferencesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refreshPreferences = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUserPreferences(user.id);

      setPreferences({
        countryCode: data.countryCode,
        displayCurrency: data.displayCurrency,
        timeZone: data.timeZone,
        locale: data.locale,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load regional preferences."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!user?.id || !isAuthenticated) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getUserPreferences(user.id);

        if (!active) return;

        setPreferences({
          countryCode: data.countryCode,
          displayCurrency: data.displayCurrency,
          timeZone: data.timeZone,
          locale: data.locale,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          "Unable to load regional preferences."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      active = false;
    };
  }, [user?.id, isAuthenticated]);

  const savePreferences = async (updatedPreferences) => {
    if (!user?.id || !isAuthenticated) {
      throw new Error("You must be logged in to save preferences.");
    }

    try {
      setSaving(true);
      setError(null);

      const data = await updateUserPreferences(
        user.id,
        updatedPreferences
      );

      const saved = {
        countryCode: data.countryCode,
        displayCurrency: data.displayCurrency,
        timeZone: data.timeZone,
        locale: data.locale,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
      };

      setPreferences(saved);

      return saved;
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save regional preferences."
      );

      throw err;
    } finally {
      setSaving(false);
    }
  };

  const value = {
    preferences: preferences || DEFAULT_PREFERENCES,
    loading,
    saving,
    error,
    savePreferences,
    refreshPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error(
      "usePreferences must be used within a PreferencesProvider"
    );
  }

  return context;
}
