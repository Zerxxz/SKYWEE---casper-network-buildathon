/**
 * Type declarations for casper-js-sdk v5 — covers all methods used by SKYWEE.
 */

declare module "casper-js-sdk" {
  export class Args {
    constructor(args?: unknown[])
    insert(name: string, value: unknown): void
    getByName(name: string): unknown
    toBytes(): Uint8Array
  }

  export class CLValue {
    static newCLString(value: string): CLValue
    static newCLValueBool(value: boolean): CLValue
    static newCLUInt8(value: number): CLValue
    static newCLUInt32(value: number): CLValue
    static newCLUInt64(value: bigint): CLValue
    static newCLUint64(value: bigint): CLValue
    static newCLUInt128(value: bigint): CLValue
    static newCLUInt256(value: bigint): CLValue
    static newCLUInt512(value: bigint): CLValue
    static newCLPublicKey(key: unknown): CLValue
    static newCLOption(value: CLValue): CLValue
    static newCLKey(key: unknown): CLValue
    static newCLUref(uref: unknown): CLValue
    static newCLList(list: CLValue[]): CLValue
    static newCLMap(entries: [CLValue, CLValue][]): CLValue
  }

  export class PublicKey {
    static fromHex(hex: string): PublicKey
    toHex(): string
    toAccountHash(): Uint8Array
  }

  export class DeployHeader {
    constructor(
      chainName: string,
      account: PublicKey,
      ttl: number,
      dependencies?: unknown[],
      timestamp?: unknown,
      gasPrice?: number,
      bodyHash?: unknown,
    )
  }

  export class Deploy {
    static makeDeploy(
      header: DeployHeader,
      payment: ExecutableDeployItem,
      session: ExecutableDeployItem,
    ): Deploy
    static toJSON(deploy: Deploy): unknown
    sign(): void
    toBytes(): Uint8Array
    isTransfer(): boolean
    isStandardPayment(): boolean
    validate(): boolean
  }

  export class ExecutableDeployItem {
    static newModuleBytes(
      moduleBytes: Uint8Array,
      args: Args,
    ): ExecutableDeployItem
    static newStoredContractByHash(
      hash: string,
      entryPoint: string,
      args: Args,
    ): ExecutableDeployItem
    static newTransfer(args: Args, amount?: bigint, target?: unknown, id?: bigint): ExecutableDeployItem
    static standardPayment(amount: bigint): ExecutableDeployItem
  }

  export const DEFAULT_DEPLOY_TTL: number
}
