export interface VaultResponseParams<T> {
  exec: (params: VaultResponseParams<T>) => Promise<T>;
}
export class VaultResponse<T> implements Promise<T> {
  value: Promise<T>;
  exec: (params: VaultResponseParams<T>) => Promise<T>;
  constructor(params: VaultResponseParams<T>) {
    const { exec } = params;
    this.value = exec(params);
    this.exec = exec;
    this[Symbol.toStringTag] = this.value[Symbol.toStringTag];
  }
  // this will eventually wrap the results in classes or objects so result.revoke()... or ... maybe

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.value.then(onfulfilled, onrejected);
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<T | TResult> {
    return this.value.catch(onrejected);
  }
  [Symbol.toStringTag]: string;

  finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return this.finally(onfinally);
  }
}
