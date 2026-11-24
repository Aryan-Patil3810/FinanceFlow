import api from "./api";

export async function getAccounts(userId) {
  const response = await api.get("/accounts", {
    params: { userId },
  });

  return response.data;
}

export async function createAccount(userId, account) {
  const response = await api.post("/accounts", account, {
    params: { userId },
  });

  return response.data;
}

export async function updateAccount(userId, accountId, account) {
  const response = await api.put(
    `/accounts/${accountId}`,
    account,
    {
      params: { userId },
    }
  );

  return response.data;
}
export async function archiveAccount(userId, accountId) {
  const response = await api.patch(
    `/accounts/${accountId}/archive`,
    null,
    {
      params: { userId },
    }
  );

  

  return response.data;
}