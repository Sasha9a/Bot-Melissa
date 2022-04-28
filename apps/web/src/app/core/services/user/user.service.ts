import httpClient from "@bot-melissa/web/core/services/api.service";

export const loginAxios = (code) => {
  return httpClient.post('/user/login', { code });
}
