
import api from "./api";

// Get accounts belonging to the authenticated user
export async function getAccounts() {
  const response = await api.get("/accounts");

  return response.data;
}

// Create an account for the authenticated user
export async function createAccount(account) {
  const response = await api.post("/accounts", account);

  return response.data;
}

// Update an account belonging to the authenticated user
export async function updateAccount(accountId, account) {
  const response = await api.put(
    `/accounts/${accountId}`,
    account
  );

  return response.data;
}

// Archive an account belonging to the authenticated user
export async function archiveAccount(accountId) {
  const response = await api.patch(
    `/accounts/${accountId}/archive`
  );

  return response.data;
}
