import api from "./api";

export async function getRecurringPayments(userId) {
  const response = await api.get("/recurring-payments", {
    params: { userId },
  });

  return response.data;
}

export async function createRecurringPayment(
  userId,
  payment
) {
  const response = await api.post(
    "/recurring-payments",
    payment,
    {
      params: { userId },
    }
  );

  return response.data;
}

export async function updateRecurringPayment(
  userId,
  paymentId,
  payment
) {
  const response = await api.put(
    `/recurring-payments/${paymentId}`,
    payment,
    {
      params: { userId },
    }
  );

  return response.data;
}

export async function updateRecurringPaymentStatus(
  userId,
  paymentId,
  status
) {
  const response = await api.patch(
    `/recurring-payments/${paymentId}/status`,
    null,
    {
      params: {
        userId,
        status,
      },
    }
  );

  return response.data;
}