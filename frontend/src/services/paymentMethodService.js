
import api from "./api";

// Get payment methods for the authenticated user
export async function getPaymentMethods() {
  const response = await api.get("/payment-methods");

  return response.data;
}

// Create a payment method
export async function createPaymentMethod(payload) {
  const response = await api.post("/payment-methods", payload);

  return response.data;
}

// Update a payment method
export async function updatePaymentMethod(paymentMethodId, payload) {
  const response = await api.put(
    `/payment-methods/${paymentMethodId}`,
    payload
  );

  return response.data;
}
