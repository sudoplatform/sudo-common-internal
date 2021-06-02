import { DefaultLogger, PublicKeyFormat } from '@sudoplatform/sudo-common'
import { KeyFormat } from '../../../../src/gen/graphqlTypes'
import KeyEntityTransformer from '../../../../src/private/transformers/keyEntityTransformer'
import {
  PublicKeyEntity,
  PublicKeyEntityFormat,
} from '../../../../src/public/types/publicKeyEntity'
import { KeyDataFactory } from '../../data-factory/keyDataFactory'

const logger = new DefaultLogger('DeviceKeyWorker')

describe('KeyEntityTransformer Test Suite', () => {
  const instanceUnderTest = new KeyEntityTransformer()
  describe('transformGraphQL', () => {
    it('transformGraphQL transforms RSAPublicKey successfully', () => {
      expect(
        instanceUnderTest.transformGraphQL(KeyDataFactory.publicKeyGraphQL),
      ).toStrictEqual<PublicKeyEntity>({
        keyId: KeyDataFactory.publicKeyEntity.keyId,
        keyRingId: KeyDataFactory.publicKeyEntity.keyRingId,
        keyData: KeyDataFactory.publicKeyEntity.keyData,
        keyFormat: PublicKeyEntityFormat.RSAPublicKey,
      })
    })

    it('transformGraphQL transforms SPKI successfully', () => {
      expect(
        instanceUnderTest.transformGraphQL({
          ...KeyDataFactory.publicKeyGraphQL,
          keyFormat: KeyFormat.Spki,
        }),
      ).toStrictEqual<PublicKeyEntity>({
        keyId: KeyDataFactory.publicKeyEntity.keyId,
        keyRingId: KeyDataFactory.publicKeyEntity.keyRingId,
        keyData: KeyDataFactory.publicKeyEntity.keyData,
        keyFormat: PublicKeyEntityFormat.SPKI,
      })
    })

    it('transforms default format to RSAPublicKey', () => {
      expect(
        instanceUnderTest.transformGraphQL({
          ...KeyDataFactory.publicKeyGraphQL,
          keyFormat: undefined,
        }),
      ).toStrictEqual<PublicKeyEntity>({
        keyId: KeyDataFactory.publicKeyEntity.keyId,
        keyRingId: KeyDataFactory.publicKeyEntity.keyRingId,
        keyData: KeyDataFactory.publicKeyEntity.keyData,
        keyFormat: PublicKeyEntityFormat.RSAPublicKey,
      })
    })
  })

  describe('transformKeyManager', () => {
    it('transformKeyManager transforms RSAPublicKey successfully', () => {
      const testPublicKey = instanceUnderTest.transformKeyManager(
        KeyDataFactory.keyManagerPublicKey,
        KeyDataFactory.publicKeyEntity.keyId,
        KeyDataFactory.publicKeyEntity.keyRingId,
      )
      logger.debug(`transformed key is ${JSON.stringify(testPublicKey)}`)
      expect(testPublicKey.keyId).toStrictEqual(
        KeyDataFactory.publicKeyEntity.keyId,
      )
      expect(testPublicKey.keyRingId).toStrictEqual(
        KeyDataFactory.publicKeyEntity.keyRingId,
      )
      expect(
        Buffer.from(testPublicKey.keyData, 'base64').toString(),
      ).toStrictEqual(KeyDataFactory.publicKeyEntity.keyData)
      expect(testPublicKey.keyFormat).toStrictEqual(
        PublicKeyEntityFormat.RSAPublicKey,
      )
    })

    it('transformKeyManager transforms SPKI successfully', () => {
      const testPublicKey = instanceUnderTest.transformKeyManager(
        {
          ...KeyDataFactory.keyManagerPublicKey,
          keyFormat: PublicKeyFormat.SPKI,
        },
        KeyDataFactory.publicKeyEntity.keyId,
        KeyDataFactory.publicKeyEntity.keyRingId,
      )
      logger.debug(`transformed key is ${JSON.stringify(testPublicKey)}`)
      expect(testPublicKey.keyId).toStrictEqual(
        KeyDataFactory.publicKeyEntity.keyId,
      )
      expect(testPublicKey.keyRingId).toStrictEqual(
        KeyDataFactory.publicKeyEntity.keyRingId,
      )
      expect(
        Buffer.from(testPublicKey.keyData, 'base64').toString(),
      ).toStrictEqual(KeyDataFactory.publicKeyEntity.keyData)
      expect(testPublicKey.keyFormat).toStrictEqual(PublicKeyEntityFormat.SPKI)
    })
  })
})
