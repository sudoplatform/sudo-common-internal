import {
  DecodeError,
  DefaultLogger,
  FatalError,
  NotSignedInError,
  SudoKeyManager,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import * as uuid from 'uuid'
import { PublicKeyEntity } from '../../public/types/publicKeyEntity'
import { UnsealInput } from '../../public/types/unsealInput'
import KeyEntityTransformer from '../transformers/keyEntityTransformer'
import { bufferToArrayBuffer } from '../util/bufferToArrayBuffer'

export interface KeyWorker {
  generateKeyPair(): Promise<PublicKeyEntity>

  getCurrentPublicKey(): Promise<PublicKeyEntity | undefined>

  unsealString(input: UnsealInput): Promise<string>
}

const logger = new DefaultLogger('KeyWorker')

export class DefaultKeyWorker implements KeyWorker {
  private currentPublicKey: PublicKeyEntity | undefined
  private keyPairIdKey: string
  private keyRingServiceName: string
  private rsaKeySize = 256

  constructor(
    private readonly keyManager: SudoKeyManager,
    private readonly sudoUserClient: SudoUserClient,
    keyPairIdKey: string,
    keyRingServiceName: string,
    rsaKeySize?: number,
  ) {
    this.keyPairIdKey = keyPairIdKey
    this.keyRingServiceName = keyRingServiceName
    if (rsaKeySize) {
      this.rsaKeySize = rsaKeySize
    }
  }

  async generateKeyPair(): Promise<PublicKeyEntity> {
    const keyPairId = uuid.v4()
    const keyPairIdBits = new TextEncoder().encode(keyPairId)
    await this.keyManager.addPassword(keyPairIdBits.buffer, this.keyPairIdKey)

    await this.keyManager.generateKeyPair(keyPairId)
    const publicKey = await this.keyManager.getPublicKey(keyPairId)
    if (publicKey === undefined) {
      throw new FatalError('Could not generate public key pair')
    }

    const subject = await this.sudoUserClient.getSubject()
    if (!subject) {
      throw new NotSignedInError()
    }
    const keyRingId = `${this.keyRingServiceName}.${subject}`
    logger.debug(`keyPairId is ${keyPairId}, keyRingId is ${keyRingId}`)

    const transformer = new KeyEntityTransformer()
    this.currentPublicKey = transformer.transformKeyManager(
      publicKey,
      keyPairId,
      keyRingId,
    )

    logger.debug(`public key generated OK for ${keyPairId}`)
    return this.currentPublicKey
  }

  async getCurrentPublicKey(): Promise<PublicKeyEntity | undefined> {
    if (this.currentPublicKey) {
      logger.debug(
        `returning existing key ${JSON.stringify(this.currentPublicKey)}`,
      )
      return this.currentPublicKey
    }

    const keyPairIdBits = await this.keyManager.getPassword(this.keyPairIdKey)
    const keyPairId = new TextDecoder('utf-8', { fatal: true }).decode(
      keyPairIdBits,
    )
    if (!keyPairId.length) {
      return undefined
    }

    const publicKey = await this.keyManager.getPublicKey(keyPairId)
    if (!publicKey) {
      return undefined
    }

    const subject = await this.sudoUserClient.getSubject()
    if (!subject) {
      throw new NotSignedInError()
    }
    const keyRingId = `${this.keyRingServiceName}.${subject}`

    const transformer = new KeyEntityTransformer()
    this.currentPublicKey = transformer.transformKeyManager(
      publicKey,
      keyPairId,
      keyRingId,
    )

    logger.debug(`public key loaded OK for ${keyPairId}`)
    return this.currentPublicKey
  }

  async unsealString(input: UnsealInput): Promise<string> {
    logger.debug(`unseal input is ${JSON.stringify(input)}`)
    const currentPublicKey = await this.getCurrentPublicKey()
    if (!currentPublicKey) {
      throw new FatalError('Key not generated')
    }
    const encryptedB64 = Buffer.from(input.encrypted, 'base64')

    const encryptedCipherKeyB64 = encryptedB64.slice(0, this.rsaKeySize)
    const encryptedData = encryptedB64.slice(this.rsaKeySize)

    let cipherKey: ArrayBuffer | undefined = undefined
    try {
      cipherKey = await this.keyManager.decryptWithPrivateKey(
        input.keyId,
        bufferToArrayBuffer(encryptedCipherKeyB64),
      )
    } catch (err) {
      logger.debug(`Decrypting AES key failed with ${err}`)
      throw new DecodeError('Could not decrypt AES key from sealed string')
    }

    if (!cipherKey) {
      throw new DecodeError('Could not extract AES key from sealed string')
    }
    let unsealedBuffer: ArrayBuffer
    try {
      unsealedBuffer = await this.keyManager.decryptWithSymmetricKey(
        cipherKey,
        bufferToArrayBuffer(encryptedData),
      )
    } catch (err) {
      logger.warn(`decrypting sealed payload failed with ${err}`)
      throw new DecodeError('Could not unseal sealed payload')
    } finally {
      // zero out our copy of the cipher key
      new Uint8Array(cipherKey).fill(0)
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(unsealedBuffer)
    } catch (err) {
      throw new DecodeError('Could not decode unsealed payload as UTF-8')
    }
  }
}
