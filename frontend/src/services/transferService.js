import api from "./api";

export async function getTransfers(userId) {
  const response = await api.get("/transfers", {
    params: { userId },
  });

  return response.data;
}

export async function createTransfer(userId, transfer) {
  const response = await api.post(
    "/transfers",
    transfer,
    {
      params: { userId },
    }
  );

  return response.data;
}