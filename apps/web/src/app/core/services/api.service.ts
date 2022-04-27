import Axios from 'axios-observable';
import { environment } from "../../../environments/environment";

const httpClient = Axios.create({
  baseURL: process.env.BASE_URL || environment.url
});

export default httpClient;
