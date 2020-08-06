import { VaultError } from '../errors';
import { getRandomNumber } from '../util';

export function authLeaseDelayCalculator(lease: VaultAuthLease) {
  const leaseDuration =
    lease.lease_duration == null ? lease.lease_duration : lease.auth.lease_duration;
  if (leaseDuration == null || leaseDuration == 0) {
    throw new VaultError('Unable to calculate delay because lease duration is undefined');
  }
  const randomPercent = getRandomNumber(40, 60) * 0.01; // 40 - 60%
  return Math.floor(leaseDuration * randomPercent);
}

export interface VaultAuthLeaseMetadata {
  role?: string;
  service_account_name?: string;
  service_account_namespace?: string;
  service_account_secret_name?: string;
  service_account_uid?: string;
  role_tag_max_ttl?: string;
  instance_id?: string;
  ami_id?: string;
  auth_type?: string;
  account_id?: string;
  user_id?: string;
  role_id?: string;
  arn?: string;
  identity_type?: string;
  principal_id?: string;
  request_id?: string;
  role_name?: string;
  username?: string;
  org?: string;
  project_id?: string;
  service_account_email?: string;
  service_account_id?: string;
}

export interface VaultAuthLeaseDetails {
  client_token?: string;
  accessor?: string;
  policies?: string[];
  metadata?: VaultAuthLeaseMetadata;
  lease_duration?: number;
  renewable?: boolean;
}

export interface VaultAuthLease {
  auth: VaultAuthLeaseDetails;
  lease_id: string;
  renewable?: boolean;
  lease_duration?: number;
  data?: any;
  warnings?: any;
}
