import { VaultClient } from './client';
import { getMountedMethods } from './util';

export const loadPayload = async <T>({
  getPayload,
  payload
}: {
  getPayload?: () => Promise<T>;
  payload?: T;
}) => (getPayload != null && typeof getPayload === 'function' ? getPayload() : payload);

export type MountedVaultMethods = ReturnType<typeof getMountedMethods>;
