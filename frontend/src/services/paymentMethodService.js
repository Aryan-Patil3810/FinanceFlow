import api from "./api";

// Get all payment methods
export async function getPaymentMethods(userId) {
  const response = await api.get("/payment-methods", {
    params: { userId },
  });

  return response.data;
}

// Create a payment method
export async function createPaymentMethod(userId, payload) {
  const response = await api.post("/payment-methods", payload, {
    params: { userId },
  });

  return response.data;
}

// Update a payment method
export async function updatePaymentMethod(userId, paymentMethodId, payload) {
  const response = await api.put(
    `/payment-methods/${paymentMethodId}`,
    payload,
    {
      params: { userId },
    }
  );

  return response.data;
}