
import api from "./api";

export async function getCurrencyRate(targetCurrency) {
  const response = await api.get("/currency/rate", {
    params: { to: targetCurrency },
  });

  return response.data;
}
