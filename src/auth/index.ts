import kubernetes from './kubernetes';
import { VaultClient } from '../client';
import { VaultResponseGeneratorOptions } from '../vaultResponseGenerator';
import { VaultAuthLease } from './lease';
import { VaultError } from '../errors';
import { loadPayload } from '..';

const authVault = function (this: VaultClient) {
  const vault = this;
  return {
    kubernetes: kubernetes.bind(vault)
  };
};

export async function execVaultLogin<PayloadType>(
  this: VaultAuthMethod,
  params: VaultLoginParams<PayloadType>
) {
  const vault = this.vault;
  const payload = await loadPayload(params);
  const result = await vault.post<VaultAuthLease>(`${this.mountPoint}/login`, payload);
  vault.token = result.auth.client_token;
  return result;
}

export default authVault;

export type VaultAuth = ReturnType<typeof authVault>;

export interface VaultAuthMethod {
  mountPoint: string;
  vault: VaultClient;
}

export type VaultLoginParams<PayloadType> = VaultResponseGeneratorOptions<
  VaultAuthLease,
  PayloadType
>;
