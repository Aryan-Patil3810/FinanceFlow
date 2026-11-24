import api from "./api";

export async function getTransactions(userId) {
  const response = await api.get("/transactions", {
    params: { userId },
  });

  return response.data;
}

export async function createTransaction(userId, transaction) {
  const response = await api.post("/transactions", transaction, {
    params: { userId },
  });

  return response.data;
}