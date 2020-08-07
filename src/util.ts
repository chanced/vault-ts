import { VaultClient } from './client';

export const pause = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getRandomNumber = (min: number, max: number) => {
  const floor = Math.ceil(min);
  return Math.floor(Math.random() * (Math.floor(max) - floor)) + floor;
};

export function getMountedMethods(mountPoint: string, vault: VaultClient) {
  const getPath = (url: string) =>
    url.startsWith(mountPoint) ? url : (mountPoint + '/' + url).replace(/[\/]+/g, '/');
  return {
    get: <ReturnType>(url: string, searchParams?: Record<string, string | number>) => {
      return vault.get<ReturnType>(getPath(url), searchParams);
    },
    put: <ReturnType>(url: string, payload: Record<string, any>) => {
      return vault.put<ReturnType>(getPath(url), payload);
    },
    post: <ReturnType>(url: string, payload: Record<string, any> | undefined) => {
      return vault.post<ReturnType>(getPath(url), payload);
    },
    delete: <ReturnType>(url: string, payload?: Record<string, any>) => {
      return vault.delete<ReturnType>(getPath(url), payload);
    },
    list: <ReturnType>(url: string, payload?: Record<string, any> | undefined) => {
      return vault.post<ReturnType>(getPath(url), payload);
    }
  };
}
