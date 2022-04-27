import httpClient from "@bot-melissa/web/core/services/api.service";
import { AxiosObservable } from "axios-observable";

export class BaseService {

  protected baseUrl: string;

  public find<T>(options?: any): AxiosObservable<T[]> {
    return httpClient.get<T[]>(
      this.baseUrl,
      {
        params: this.getParams(options)
      });
  }

  public findById<T>(id: string): AxiosObservable<T> {
    return httpClient.get<T>(this.baseUrl + '/' + id);
  }

  public create<T>(model: any): AxiosObservable<T> {
    return httpClient.post<T>(this.baseUrl, model);
  }

  public update<T>(id, model): AxiosObservable<T> {
    return httpClient.put<T>(this.baseUrl + '/' + id, model);
  }

  public deleteById<T>(id: string): AxiosObservable<T> {
    return httpClient.delete<T>(this.baseUrl + '/' + id);
  }

  protected getParams(options) {
    const params = {};
    if (options) {
      Object.entries(options).forEach((o) => {
        params[o[0]] = o[1];
      });
    }
    return params;
  }
}
