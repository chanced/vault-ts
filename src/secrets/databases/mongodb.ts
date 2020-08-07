import { VaultClient } from '../../client';
import { getMountedMethods } from '../../util';

import { DatabaseSecretsEngineVaultConfig } from '.';
import { VaultResponseGenerator } from '../../vaultResponseGenerator';
import { VaultResponse } from '../../vaultResponse';

export interface MongoDBWriteConcern {
  /**
   * requests acknowledgement that the write operation has
   * propagated to a specified number of mongod hosts
   * @default 1
   */
  w?: number | 'majority' | string;
  /**
   * requests acknowledgement that the write operation has
   * propagated to a specified number of mongod hosts
   * @default 1
   */
  wmode?: number | 'majority' | string;

  /**
   * requests acknowledgement from MongoDB that the write operation has
   * been written to the journal
   * @default false
   */
  j?: boolean;
  /**
   * a time limit, in milliseconds, for the write concern
   */
  wtimeout?: number;
}

export interface MongoDBSecretsEngineVaultConfig
  extends DatabaseSecretsEngineVaultConfig<MongoDBWriteConcern> {}

export const mongodbSecretsVault = function (
  this: VaultClient,
  name: string | undefined,
  mountPoint: string = 'database'
) {
  const vault = this;
  const mountedMethods = getMountedMethods(mountPoint, vault);
  return Object.assign(mountedMethods, {
    vault,
    mountPoint: mountPoint,
    configure: (params: MongoDBSecretsEngineVaultConfig) => {
      let { write_concern } = params;
      if (typeof write_concern !== 'string') {
        write_concern = JSON.stringify(write_concern);
      }
      return new VaultResponse<unknown>({
        exec: () => {
          return mountedMethods.post(`config/${name}`, {
            ...params,
            write_concern,
            plugin_name: 'mongodb-database-plugin'
          });
        }
      });
    }
  });
};
