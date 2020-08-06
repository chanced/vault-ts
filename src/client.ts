import Got, {
  RequiredRetryOptions,
  HTTPSOptions,
  HandlerFunction,
  GotReturn,
  GotRequestFunction
} from 'got';

import { parse } from 'secure-json-parse';
import url, { URL } from 'url';
import { VaultError, errorHandler } from './errors';
import ms from 'ms';
import { VaultResponse } from './vaultResponse';
import { VaultResponseGenerator } from './vaultResponseGenerator';
import { VaultAuth } from './auth/index';
import authVault from './auth/index';

export class VaultClient implements VaultClient {
  protected apiVersion: string;
  private _namespace?: string;
  private _token?: string;
  public auth: VaultAuth;
  async get<ReturnType>(url: string, searchParams?: Record<string, string | number>) {
    return await this.gotInstance(url, { searchParams }).json<ReturnType>();
  }
  async put<ReturnType>(url: string, data: Record<string, any>) {
    return await this.gotInstance
      .put(url, {
        json: data,
        responseType: 'json'
      })
      .json<ReturnType>();
  }
  async post<ReturnType>(url: string, payload: Record<string, any> | undefined) {
    return await this.gotInstance
      .post<ReturnType>(url, {
        json: payload
      })
      .json<ReturnType>();
  }
  async delete<ReturnType>(url: string, searchParams?: Record<string, string | number>) {
    return await this.gotInstance
      .delete<ReturnType>(url, {
        searchParams
      })
      .json<ReturnType>();
  }

  async list<ReturnType>(url: string, searchParams?: Record<string, string | number>) {
    searchParams = { ...searchParams, list: 1 };
    return await this.gotInstance
      .get<ReturnType>(url, {
        searchParams
      })
      .json<ReturnType>();
  }

  private _headers: Record<string, string>;
  public endpoint: string;
  public requestOptions:
    | {
        https?: HTTPSOptions | undefined;
        retry?: number | Partial<RequiredRetryOptions> | undefined;
      }
    | undefined;

  // public get sys(): SystemBackend {
  //   return this._sys();
  // }
  // protected _sys: typeof sys;

  public get namespace(): string | undefined {
    return this._namespace;
  }
  public set namespace(namespace: string | undefined) {
    this.namespace = namespace;
    this._headers = this.getHeaders();
  }

  public get token(): string | undefined {
    return this._token;
  }

  public set token(newToken: string | undefined) {
    this._token = newToken;
    this._headers = this.getHeaders();
  }

  private get _url(): string {
    const parsed = new URL(this.apiVersion, this.endpoint);
    return parsed.origin + parsed.pathname;
  }

  protected get gotInstance() {
    return Got.extend({
      ...this.requestOptions,
      prefixUrl: this._url,
      headers: this._headers,
      throwHttpErrors: true,
      parseJson: (text: string) => parse(text),
      handlers: [errorHandler],
      hooks: {
        beforeRequest: [
          options => {
            if (!this._token) {
              throw new Error('Token was not set');
            }

            options.headers = { ...options.headers, ...this._headers };
          }
        ]
      }
    });
  }

  constructor(params: VaultClientParams) {
    const { apiVersion, endpoint, token, namespace, requestOptions } = params;
    this.apiVersion = apiVersion || 'v1';
    this.endpoint = endpoint;
    this._token = token;
    this.namespace = namespace;
    this._headers = this.getHeaders();
    this.requestOptions = requestOptions;
    this.auth = authVault.bind(this)();
  }

  protected getHeaders() {
    let headers: Record<string, string> = {
      'User-Agent': 'Vault-ts/0.0.1',
      Accept: 'application/json'
    };
    if (this.namespace) {
      headers['X-Vault-Namespace'] = this.namespace;
    }
    if (this.token) {
      headers['X-Vault-Token'] = this.token;
    }
    return headers;
  }
}

export interface VaultClientParams {
  apiVersion?: 'v1' | string;
  endpoint: string;
  token?: string;
  namespace?: string;
  requestOptions?: {
    https?: HTTPSOptions;
    retry?: number | Partial<RequiredRetryOptions>;
  };
}
