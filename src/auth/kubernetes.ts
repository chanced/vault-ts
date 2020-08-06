import { VaultResponse } from '../vaultResponse';
import { VaultResponseGenerator, VaultResponseGeneratorOptions } from '../vaultResponseGenerator';
import { VaultClient } from '../client';
import { stringify } from 'querystring';
import { VaultError } from '../errors';
import { getRandomNumber } from '../util';
import { authLeaseDelayCalculator, VaultAuthLease } from './lease';
import { VaultLoginParams, execVaultLogin, VaultAuthMethod } from './index';
import { MountedVaultMethods } from '..';
import { getMountedMethods } from '../index';

/**
 * This is the API for the Vault Kubernetes auth method plugin. To learn
 * more about the usage and operation, see the Vault Kubernetes auth method.
 * @see https://www.vaultproject.io/api/auth/kubernetes
 */
export type KubernetesAuthVault = ReturnType<typeof kubernetesAuthVault> & VaultAuthMethod;

export const kubernetesAuthVault = function (this: VaultClient, mountPoint: string | undefined) {
  const vault = this;
  mountPoint = mountPoint || 'kubernetes';

  if (!mountPoint.startsWith('auth/')) {
    mountPoint = `auth/${mountPoint}`;
  }
  const mountedMethods = getMountedMethods(mountPoint, vault);
  return Object.assign(mountedMethods, {
    vault,
    /**
     * Returns the previously configured config, including credentials.
     * @see https://www.vaultproject.io/api-docs/auth/kubernetes#create-role
     */
    readConfig: () =>
      new VaultResponse<KubernetesVaultConfig>({
        exec: () => vault.get<KubernetesVaultConfig>(`${mountPoint}/config`)
      }),
    /**
     * The Kubernetes auth method validates service account JWTs and
     * verifies their existence with the Kubernetes TokenReview API. This
     * endpoint configures the public key used to validate the JWT signature
     * and the necessary information to access the Kubernetes API.
     */
    setConfig: <ReturnType = unknown>(config: KubernetesVaultConfig) =>
      new VaultResponse<ReturnType>({
        exec: params => vault.post<ReturnType>('/config', config)
      }),
    login: (params: VaultLoginParams<KubernetesVaultLoginPayload>) =>
      new VaultResponseGenerator<VaultAuthLease>({
        exec: execVaultLogin,
        calculateDelay: params.calculateDelay || authLeaseDelayCalculator
      }),
    /**
     * Registers a role in the auth method. Role types have specific entities
     * that can perform login operations against this endpoint. Constraints
     * specific to the role type must be set on the role. These are applied
     * to the authenticated entities attempting to login.
     */
    createRole: <ReturnType = unknown>(role: VaultKubernetesRole) =>
      new VaultResponse<ReturnType>({
        exec: () => mountedMethods.post<ReturnType>(`/role/${role.name}`, role)
      }),
    /**
     * Returns the previously registered role configuration.
     *
     * @see https://www.vaultproject.io/api-docs/auth/kubernetes#create-role
     */

    readRole: (name: string) =>
      new VaultResponse<VaultKubernetesRole>({
        exec: () => mountedMethods.get<VaultKubernetesRole>(`/role/${name}`)
      }),
    /**
     * Lists all the roles that are registered with the auth method.
     *
     * @see https://www.vaultproject.io/api-docs/auth/kubernetes#list-roles
     */
    listRoles: () =>
      new VaultResponse<{ keys: string[] }>({
        exec: () => mountedMethods.list('/role')
      }),
    /**
     * Deletes the previously registered role.
     */

    deleteRole: <ReturnType = unknown>(role: string) =>
      new VaultResponse<ReturnType>({
        exec: () => mountedMethods.delete<ReturnType>(`/role/${role}`)
      })
  });
};
export default kubernetesAuthVault;

export interface KubernetesVaultConfig {
  /**
   *  Host must be a host string, a host:port pair, or a URL to the
   * base of the Kubernetes API server.
   */
  kubernetes_host: string;

  /**
   * PEM encoded CA cert for use by the TLS client used to talk with the
   * Kubernetes
   *
   * API. NOTE: Every line must end with a newline: \n
   */
  kubernetes_ca_cert?: string;

  /**
   * A service account JWT used to access the TokenReview API to validate
   * other JWTs during login. If not set the JWT used for login will be
   * used to access the API.
   */
  token_reviewer_jwt?: string;

  /**
   * Optional list of PEM-formatted public keys or certificates used to
   * verify the signatures of Kubernetes service account JWTs. If a
   * certificate is given, its public key will be extracted. Not every
   * installation of Kubernetes exposes these keys.
   */
  pem_keys?: string[] | string;

  /**
   * Optional JWT issuer. If no issuer is specified, then this plugin
   * will use kubernetes.io/serviceaccount as the default issuer.
   */
  issuer?: string;

  /**
   * Disable JWT issuer validation. Allows to skip ISS
   */
  disable_iss_validation?: boolean;
}
export interface VaultKubernetesRole {
  /** name (string: <required>) -
   * Name of the role. */
  name: string;

  /**
   * List of service account names able to access this role. If set
   * to "*" all names are allowed, both this and
   * bound_service_account_namespaces can not be "*".
   * */
  bound_service_account_names: string[] | string;

  /**
   * List of namespaces allowed to access this role. If set to "*" all
   * namespaces are allowed, both this and bound_service_account_names can
   * not be set to "*".
   */
  bound_service_account_namespaces?: string[] | string;

  /**
   * audience (string: "") -
   * Optional Audience claim to verify in the JWT.
   */
  audience?: string;

  /**
   * token_ttl (integer: 0 or string: "") -
   * The incremental lifetime for generated tokens. This current value of
   * this will be referenced at renewal time.
   */
  token_ttl?: number | string;

  /** token_max_ttl (integer: 0 or string: "") -
   * The maximum lifetime for generated tokens. This current value of this
   * will be referenced at renewal time.
   */
  token_max_ttl?: number | string;

  /**
   * token_policies (array: [] or comma-delimited string: "") -
   * List of policies to encode onto generated tokens. Depending on the auth
   * method, this list may be supplemented by user/group/other values.
   */
  token_policies?: string[] | string;

  /**
   * token_bound_cidrs (array: [] or comma-delimited string: "") -
   * List of CIDR blocks; if set, specifies blocks of IP addresses which can
   * authenticate successfully, and ties the resulting token to these blocks
   * as well.
   */
  token_bound_cidrs?: string[] | string;

  /** token_explicit_max_ttl (integer: 0 or string: "") -
   * If set, will encode an explicit max TTL onto the token. This is a hard
   * cap even if token_ttl and token_max_ttl would otherwise allow a renewal.
   */
  token_explicit_max_ttl?: number | string;

  /**
   * token_no_default_policy (bool: false) -
   * If set, the default policy will not be set on generated tokens;
   * otherwise it will be added to the policies set in token_policies.
   */
  token_no_default_policy?: boolean;

  /**
   * token_num_uses (integer: 0) -
   * The maximum number of times a generated token may be used (within its
   * lifetime); 0 means unlimited. If you require the token to have the
   * ability to create child tokens, you will need to set this value to 0.
   */
  token_num_uses?: number;

  /** token_period (integer: 0 or string: "") -
   * The period, if any, to set on the token.
   */
  token_period: number | string;

  /**
   * token_type (string: "") -
   * The type of token that should be generated. Can be service, batch, or
   * default to use the mount's tuned default (which unless changed will be
   * service tokens). For token store roles, there are two additional
   * possibilities: default-service and default-batch which specify the type
   * to return unless the client requests a different type at generation
   * time.
   */
  token_type: string;
}

export interface VaultKubernetesLoginPayload {
  role: string;
  jwt: string;
}

export interface VaultKubernetesRoleResponse {
  data: VaultKubernetesRole;
}
export interface VaultListRolesResponse {
  data: { keys: string[] };
}
export interface KubernetesVaultLoginPayload {
  role: string;
  jwt: string;
}
