import api from "./api";

export async function getPaymentOccurrences(userId) {
  const response = await api.get("/payment-occurrences", {
    params: { userId },
  });

  return response.data;
}

export async function getUpcomingPaymentOccurrences(
  userId,
  startDate,
  endDate
) {
  const response = await api.get(
    "/payment-occurrences/upcoming",
    {
      params: {
        userId,
        startDate,
        endDate,
      },
    }
  );

  return response.data;
}

export async function generateUpcomingOccurrences(
  userId,
  daysAhead = 30
) {
  const response = await api.post(
    "/payment-occurrences/generate",
    null,
    {
      params: {
        userId,
        daysAhead,
      },
    }
  );

  return response.data;
}

export async function markPaymentOccurrenceAsPaid(
  userId,
  occurrenceId,
  actualAmount
) {
  const response = await api.patch(
    `/payment-occurrences/${occurrenceId}/paid`,
    null,
    {
      params: {
        userId,
        actualAmount,
      },
    }
  );

  return response.data;
}

export async function skipPaymentOccurrence(
  userId,
  occurrenceId
) {
  const response = await api.patch(
    `/payment-occurrences/${occurrenceId}/skip`,
    null,
    {
      params: {
        userId,
      },
    }
  );

  return response.data;
}