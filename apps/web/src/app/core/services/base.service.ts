import httpClient from "@bot-melissa/web/core/services/api.service";
import { AxiosObservable } from "axios-observable";

export const findAxios = <T>(baseUrl: string, options?: any): AxiosObservable<T[]> => {
  return httpClient.get<T[]>(
    baseUrl,
    {
      params: getParams(options)
    });
}

export const findByIdAxios = <T>(baseUrl: string, id: string): AxiosObservable<T> => {
  return httpClient.get<T>(baseUrl + '/' + id);
}

export const createAxios = <T>(baseUrl: string, model: any): AxiosObservable<T> => {
  return httpClient.post<T>(baseUrl, model);
}

export const updateAxios = <T>(baseUrl: string, id: string, model: any): AxiosObservable<T> => {
  return httpClient.put<T>(baseUrl + '/' + id, model);
}

export const deleteByIdAxios = <T>(baseUrl: string, id: string): AxiosObservable<T> => {
  return httpClient.delete<T>(baseUrl + '/' + id);
}

export const getParams = (options) => {
  const params = {};
  if (options) {
    Object.entries(options).forEach((o) => {
      params[o[0]] = o[1];
    });
  }
  return params;
}
