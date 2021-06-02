import { KeyFormat, PublicKey } from '../../../src/gen/graphqlTypes'
import { PublicKey as KeyManagerPublicKey } from '@sudoplatform/sudo-common'
import { PublicKeyFormat } from '@sudoplatform/sudo-common'
import {
  PublicKeyEntity,
  PublicKeyEntityFormat,
} from '../../../src/public/types/publicKeyEntity'

export class KeyDataFactory {
  static readonly publicKeyEntity: PublicKeyEntity = {
    keyId: 'dummyKeyId',
    keyData: 'dummyPublicKey',
    keyRingId: 'dummyKeyRingId',
    keyFormat: PublicKeyEntityFormat.RSAPublicKey,
  }

  static readonly keyData = Buffer.from(
    KeyDataFactory.publicKeyEntity.keyData,
  ).toString('base64')

  static readonly generatedPublicKeyEntity: PublicKeyEntity = {
    keyId: 'generatedId',
    keyRingId: 'testCommonService.testCommonOwner',
    keyData: KeyDataFactory.keyData,
    keyFormat: PublicKeyEntityFormat.RSAPublicKey,
  }

  static readonly publicKeyGraphQL: PublicKey = {
    id: 'dummyId',
    owner: 'dummyOwner',
    version: 1,
    createdAtEpochMs: 1.0,
    updatedAtEpochMs: 2.0,
    algorithm: 'dummyAlgorithm',
    keyId: 'dummyKeyId',
    keyRingId: 'dummyKeyRingId',
    keyFormat: KeyFormat.RsaPublicKey,
    publicKey: 'dummyPublicKey',
  }

  static readonly keyManagerPublicKey: KeyManagerPublicKey = {
    keyData: Buffer.from(KeyDataFactory.publicKeyEntity.keyData),
    keyFormat: PublicKeyFormat.RSAPublicKey,
  }
}
