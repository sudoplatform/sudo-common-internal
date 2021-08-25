import { ApiClientManager } from '@sudoplatform/sudo-api-client'
import {
  CachePolicy,
  DefaultLogger,
  DefaultSudoKeyManager,
  SudoCryptoProvider,
  SudoKeyManager,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { WebSudoCryptoProvider } from '@sudoplatform/sudo-web-crypto-provider'
import { PaginatedPublicKey } from '../gen/graphqlTypes'
import { ApiClient } from '../private/client/apiClient'
import { FetchPolicyTransformer } from '../private/transformers/fetchPolicyTransformer'
import KeyEntityFormatTransformer from '../private/transformers/keyEntityFormatTransformer'
import KeyEntityTransformer from '../private/transformers/keyEntityTransformer'
import { DefaultKeyWorker, KeyWorker } from '../private/workers/keyWorker'
import { PublicKeyEntity } from './types/publicKeyEntity'
import { UnsealInput } from './types/unsealInput'

/**
 * Representation of a public/private key pair repository used in business logic.
 * Used to perform CRUD operations for key pairs.
 */
export interface SudoKeyRepository {
  /**
   * Generate a key pair on the device. Returns the freshly generated key pair.
   */
  generate(): Promise<PublicKeyEntity>

  /**
   * Get the current key pair on the device. Returns `undefined` if there is no current key pair.
   */
  getCurrentPublicKey(): Promise<PublicKeyEntity | undefined>

  /**
   * Register a public key to the service.
   * @param publicKey Public key to be registered.
   */
  registerPublicKey(publicKey: PublicKeyEntity): Promise<PublicKeyEntity>

  /**
   * Determine if a key is registered to the service.
   * @param publicKey Public key to determine if registered.
   * @param cachePolicy Policy used for accessing the data record.
   */
  isPublicKeyRegistered(
    publicKey: PublicKeyEntity,
    cachePolicy: CachePolicy,
  ): Promise<boolean>

  /**
   * Get a public key by its id. If no key can be found, `undefined` will be returned.
   * @param id Identifier of the key.
   */
  getPublicKeyById(id: string): Promise<PublicKeyEntity | undefined>

  /**
   * Unseal a sealed string with the provided key id and algorithm
   *
   * @param input the string to unseal plus the key id and algorithm to
   *  use when unsealing
   */
  unsealString(input: UnsealInput): Promise<string>
}

export type SudoKeyRepositoryOptions = {
  /** Sudo User client to use. No default */
  sudoUserClient: SudoUserClient

  /**
   * SudoCryptoProvider to use. Default is to use WebSudoCryptoProvider
   */
  sudoCryptoProvider?: SudoCryptoProvider

  /**
   * SudoKeyManager to user. Default is to create a DefaultSudoKeyManager
   * specifying key namespace of
   */
  sudoKeyManager?: SudoKeyManager

  /**
   * A unique identifier for keeping track of generated key pairs
   */
  keyPairIdKey: string

  /**
   * Name space for key ring id's. Usually, the associated sudoplatform
   * service name
   */
  keyRingNameSpace: string

  /**
   * RSA key size, defaults to 256
   */
  rsaKeySize?: number

  /**
   * API client manager to use. No default
   */
  apiClientManager?: ApiClientManager

  /** Undocumented */
  apiClient?: ApiClient
}

export class DefaultSudoKeyRepository implements SudoKeyRepository {
  private readonly log = new DefaultLogger()
  private readonly sudoCryptoProvider: SudoCryptoProvider
  private readonly sudoKeyManager: SudoKeyManager
  private readonly sudoUserClient: SudoUserClient
  private readonly keyWorker: KeyWorker
  private readonly apiClient: ApiClient
  private readonly keyTransformer: KeyEntityTransformer
  private readonly keyFormatTransformer: KeyEntityFormatTransformer
  private readonly fetchPolicyTransformer: FetchPolicyTransformer
  private static KEY_ALGORITHM = 'RSAEncryptionOAEPAESCBC'

  constructor(opts: SudoKeyRepositoryOptions) {
    this.sudoUserClient = opts.sudoUserClient
    this.sudoCryptoProvider =
      opts.sudoCryptoProvider ??
      new WebSudoCryptoProvider('common-internal', 'no-service')
    this.sudoKeyManager =
      opts.sudoKeyManager ?? new DefaultSudoKeyManager(this.sudoCryptoProvider)
    this.keyWorker = new DefaultKeyWorker(
      this.sudoKeyManager,
      this.sudoUserClient,
      opts.keyPairIdKey,
      opts.keyRingNameSpace,
      opts.rsaKeySize,
    )
    this.apiClient =
      opts.apiClient ??
      new ApiClient(opts.keyRingNameSpace, opts.apiClientManager)
    this.keyTransformer = new KeyEntityTransformer()
    this.keyFormatTransformer = new KeyEntityFormatTransformer()
    this.fetchPolicyTransformer = new FetchPolicyTransformer()
  }
  generate(): Promise<PublicKeyEntity> {
    return this.keyWorker.generateKeyPair()
  }

  getCurrentPublicKey(): Promise<PublicKeyEntity | undefined> {
    return this.keyWorker.getCurrentPublicKey()
  }

  async registerPublicKey(
    publicKey: PublicKeyEntity,
  ): Promise<PublicKeyEntity> {
    const result = await this.apiClient.createPublicKey({
      keyId: publicKey.keyId,
      keyRingId: publicKey.keyRingId,
      algorithm: DefaultSudoKeyRepository.KEY_ALGORITHM,
      publicKey: publicKey.keyData,
      keyFormat: this.keyFormatTransformer.transformEntity(publicKey.keyFormat),
    })
    return this.keyTransformer.transformGraphQL(result)
  }

  async isPublicKeyRegistered(
    publicKey: PublicKeyEntity,
    cachePolicy: CachePolicy,
  ): Promise<boolean> {
    let token: string | undefined = undefined
    const fetchPolicy =
      this.fetchPolicyTransformer.transformCachePolicy(cachePolicy)
    do {
      const result: PaginatedPublicKey | undefined =
        await this.apiClient.getKeyRing(
          publicKey.keyRingId,
          fetchPolicy,
          undefined,
          token,
        )
      const matched = result?.items.some((k) => k.keyId === publicKey.keyId)
      if (matched) {
        return true
      }
      token = result?.nextToken ?? undefined
    } while (token !== undefined)

    return false
  }

  async getPublicKeyById(id: string): Promise<PublicKeyEntity | undefined> {
    const result = await this.apiClient.getPublicKey(id, 'network-only')
    if (!result) {
      return undefined
    }
    return this.keyTransformer.transformGraphQL(result)
  }

  async unsealString(input: UnsealInput): Promise<string> {
    return await this.keyWorker.unsealString(input)
  }
}
