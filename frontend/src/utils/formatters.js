
export function formatCurrency(
  amount,
  currency = "INR",
  locale = "en-IN"
) {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatNumber(
  value,
  locale = "en-IN"
) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return new Intl.NumberFormat(locale).format(Number(value));
}

export function formatDate(
  date,
  dateFormat = "DD/MM/YYYY",
  timeZone = "Asia/Kolkata"
) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(parsedDate);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const { day, month, year } = values;

  switch (dateFormat) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;

    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;

    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatTime(
  date,
  timeFormat = "12H",
  timeZone = "Asia/Kolkata"
) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12H",
  }).format(parsedDate);
}

export function formatDateTime(
  date,
  preferences
) {
  if (!date) return "—";

  return `${formatDate(
    date,
    preferences.dateFormat,
    preferences.timeZone
  )} ${formatTime(
    date,
    preferences.timeFormat,
    preferences.timeZone
  )}`;
}
