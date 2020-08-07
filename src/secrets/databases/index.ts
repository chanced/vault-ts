import { VaultClient } from '../../client';

export interface DatabaseSecretsVault {
  vault: VaultClient;
  mountPath: string;
  name: string;
}

export const databaseSecretsVault = function (vault: VaultClient) {};

export interface DatabaseSecretsEngineVaultConfig<WriteConcern extends object = {}> {
  /**
   * Specifies the MongoDB standard connection string (URI). This field can
   * be templated and supports passing the username and password parameters
   * in the following format {{field_name}}. A templated connection URL is
   * required when using root credential rotation.
   */
  connection_url: string;
  /**
   * Specifies the MongoDB write concern. This is set for the entirety of
   * the session, maintained for the lifecycle of the plugin process. Must
   * be a serialized JSON object, or a base64-encoded serialized JSON
   * object. The JSON payload values map to the values in the Safe struct
   * from the mgo driver.
   */
  write_concern?: string | WriteConcern;
  /**
   *  The root credential username used in the connection URL.
   */
  username?: string;
  /**
   * The root credential password used in the connection URL.
   */
  password?: string;

  /**
   * x509 certificate for connecting to the database. This must be a PEM
   * encoded version of the private key and the certificate combined.
   */
  tls_certificate_key?: string;

  /**
   * x509 CA file for validating the certificate presented by the MongoDB
   * server. Must be PEM encoded.
   */
  tls_ca?: string;
  allowed_roles?: string | string[];
}
