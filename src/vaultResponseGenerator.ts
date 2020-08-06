import { VaultResponse, VaultResponseParams } from './vaultResponse';
import { VaultClient } from './client';
import { pause } from './util';
import ms from 'ms';

interface VaultResponseGeneratorParams<T> extends VaultResponseParams<T> {
  /**
   * calculate the delay in seconds or anything ms will parse
   */
  calculateDelay: (currentValue: T) => number | string;
}
export type VaultResponseGeneratorOptions<ResponseType, PayloadType> = Partial<
  VaultResponseGeneratorParams<ResponseType>
> & {
  payload?: PayloadType;
  getPayload?: () => Promise<PayloadType>;
};

export class VaultResponseGenerator<T> extends VaultResponse<T>
  implements AsyncGenerator<T, never, undefined> {
  public calculateDelay: (currentValue: T) => number | string;
  public previousValue?: T;
  constructor(params: VaultResponseGeneratorParams<T>) {
    super(params);
    this.calculateDelay = params.calculateDelay;
  }
  async return(value: PromiseLike<never>): Promise<IteratorResult<T, never>> {
    const val = await this.value;
    return { value: val };
  }
  throw(e: any): Promise<IteratorResult<T, never>> {
    throw e;
  }
  async next() {
    return { value: await this.exec() };
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, never, void> {
    while (true) {
      const result = await this.value;
      yield result;
      let interval = this.calculateDelay(result);
      interval = typeof interval === 'string' ? ms(interval) : interval * 1000;
      this.value = this.exec();
      this.previousValue = result;
      await pause(interval);
    }
  }
}
