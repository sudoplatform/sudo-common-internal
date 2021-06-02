import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { ApiClient } from '../../../src/private/client/apiClient'
import { KeyWorker } from '../../../src/private/workers/keyWorker'
import {
  DefaultSudoKeyRepository,
  SudoKeyRepositoryOptions,
} from '../../../src/public/sudoKeyRepository'
import { PublicKey } from '../../../src/gen/graphqlTypes'
import {
  CachePolicy,
  DefaultLogger,
  DefaultSudoKeyManager,
} from '@sudoplatform/sudo-common'
import { KeyDataFactory } from '../data-factory/keyDataFactory'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { WebSudoCryptoProvider } from '@sudoplatform/sudo-web-crypto-provider'
import KeyEntityFormatTransformer from '../../../src/private/transformers/keyEntityFormatTransformer'

describe('DefaultKeyRepositry test suite', () => {
  const mockApiClient = mock<ApiClient>()
  const mockKeyWorker = mock<KeyWorker>()

  const mockSudoUserClient = mock<SudoUserClient>()
  const mockSudoCryptoProvider = mock<WebSudoCryptoProvider>()
  const mockSudoKeyManager = mock<DefaultSudoKeyManager>()

  const logger = new DefaultLogger('unit-test')

  let instanceUnderTest: DefaultSudoKeyRepository

  beforeEach(() => {
    reset(mockApiClient)
    reset(mockKeyWorker)
    reset(mockSudoUserClient)
    reset(mockSudoCryptoProvider)
    reset(mockSudoKeyManager)

    const keyRepositoryOpts: SudoKeyRepositoryOptions = {
      sudoUserClient: instance(mockSudoUserClient),
      sudoCryptoProvider: instance(mockSudoCryptoProvider),
      sudoKeyManager: instance(mockSudoKeyManager),
      keyPairIdKey: 'integration-test-keypair-key',
      keyRingNameSpace: 'integration-tests',
      apiClient: instance(mockApiClient),
    }

    instanceUnderTest = new DefaultSudoKeyRepository(keyRepositoryOpts)
  })

  const nonMatchingPublicKey: PublicKey = {
    ...KeyDataFactory.publicKeyGraphQL,
    id: 'other-key-id',
    keyId: 'other-key-id',
  }

  describe('isPublicKeyRegistered tests', () => {
    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'should return false if there are no matching keys at all when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve({ items: [nonMatchingPublicKey], nextToken: undefined })

        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toEqual(false)

        const [actualKeyRingId, , , actualNextToken] = capture(
          mockApiClient.getKeyRing,
        ).first()
        expect(actualKeyRingId).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken).toBeUndefined()
        verify(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'should return true if there is match in single page keyring when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve({
          items: [KeyDataFactory.publicKeyGraphQL],
          nextToken: undefined,
        })

        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toEqual(true)

        const [actualKeyRingId, , , actualNextToken] = capture(
          mockApiClient.getKeyRing,
        ).first()
        expect(actualKeyRingId).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken).toBeUndefined()
        verify(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'should return true if there is match in first of a multi page keyring when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve({
          items: [KeyDataFactory.publicKeyGraphQL],
          nextToken: 'next-token-1',
        })

        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toEqual(true)

        const [actualKeyRingId, , , actualNextToken] = capture(
          mockApiClient.getKeyRing,
        ).first()
        expect(actualKeyRingId).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken).toBeUndefined()
        verify(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).once()
      },
    )

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'should return true if there is match in non-first page of a multi page keyring when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(
          { items: [], nextToken: 'next-token-1' },
          {
            items: [KeyDataFactory.publicKeyGraphQL],
            nextToken: 'next-token-2',
          },
        )

        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toEqual(true)

        const [actualKeyRingId1, , , actualNextToken1] = capture(
          mockApiClient.getKeyRing,
        ).first()
        expect(actualKeyRingId1).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken1).toBeUndefined()

        const [actualKeyRingId2, , , actualNextToken2] = capture(
          mockApiClient.getKeyRing,
        ).second()
        expect(actualKeyRingId2).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken2).toEqual('next-token-1')

        verify(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).twice()
      },
    )

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'should return false if there is no match in a multi page keyring when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(
          { items: [nonMatchingPublicKey], nextToken: 'next-token-1' },
          { items: [], nextToken: 'next-token-2' },
          { items: [], nextToken: undefined },
        )

        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toEqual(false)

        const [actualKeyRingId1, , , actualNextToken1] = capture(
          mockApiClient.getKeyRing,
        ).first()
        expect(actualKeyRingId1).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken1).toBeUndefined()

        const [actualKeyRingId2, , , actualNextToken2] = capture(
          mockApiClient.getKeyRing,
        ).second()
        expect(actualKeyRingId2).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken2).toEqual('next-token-1')

        const [actualKeyRingId3, , , actualNextToken3] = capture(
          mockApiClient.getKeyRing,
        ).third()
        expect(actualKeyRingId3).toEqual(
          KeyDataFactory.publicKeyEntity.keyRingId,
        )
        expect(actualNextToken3).toEqual('next-token-2')

        verify(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thrice()
      },
    )

    it.each`
      cachePolicy               | test
      ${CachePolicy.CacheOnly}  | ${'cache'}
      ${CachePolicy.RemoteOnly} | ${'remote'}
    `(
      'returns false if appsync returns undefined when calling $test',
      async ({ cachePolicy }) => {
        when(
          mockApiClient.getKeyRing(
            anything(),
            anything(),
            anything(),
            anything(),
          ),
        ).thenResolve(undefined)
        await expect(
          instanceUnderTest.isPublicKeyRegistered(
            KeyDataFactory.publicKeyEntity,
            cachePolicy,
          ),
        ).resolves.toBe(false)
      },
    )
  })

  describe('registerPublicKey tests', () => {
    it('successfully registers good public key', async () => {
      when(mockApiClient.createPublicKey(anything())).thenResolve(
        KeyDataFactory.publicKeyGraphQL,
      )
      await expect(
        instanceUnderTest.registerPublicKey(KeyDataFactory.publicKeyEntity),
      ).resolves.toStrictEqual(KeyDataFactory.publicKeyEntity)

      const [createPublicKeyArgs] = capture(
        mockApiClient.createPublicKey,
      ).first()
      const keyFormatTransformer = new KeyEntityFormatTransformer()
      expect(createPublicKeyArgs).toStrictEqual({
        keyId: KeyDataFactory.publicKeyEntity.keyId,
        keyRingId: KeyDataFactory.publicKeyEntity.keyRingId,
        algorithm: 'RSAEncryptionOAEPAESCBC',
        publicKey: KeyDataFactory.publicKeyEntity.keyData,
        keyFormat: keyFormatTransformer.transformEntity(
          KeyDataFactory.publicKeyEntity.keyFormat,
        ),
      })
    })
  })

  describe('getPublicKeyById tests', () => {
    it('returns valid public key', async () => {
      when(mockApiClient.getPublicKey(anything(), anything())).thenResolve(
        KeyDataFactory.publicKeyGraphQL,
      )
      await expect(
        instanceUnderTest.getPublicKeyById('testId'),
      ).resolves.toStrictEqual(KeyDataFactory.publicKeyEntity)

      const [getPublicKeyArgs] = capture(mockApiClient.getPublicKey).first()
      logger.debug(`getPublicKeyArgs is ${JSON.stringify(getPublicKeyArgs)}`)
      expect(getPublicKeyArgs).toStrictEqual('testId')
      verify(mockApiClient.getPublicKey(anything(), anything())).once()
    })

    it('returns undefined when no matching public key', async () => {
      when(mockApiClient.getPublicKey(anything(), anything())).thenResolve(
        undefined,
      )
      await expect(
        instanceUnderTest.getPublicKeyById('testId'),
      ).resolves.toBeUndefined()

      const [getPublicKeyArgs] = capture(mockApiClient.getPublicKey).first()
      logger.debug(`getPublicKeyArgs is ${JSON.stringify(getPublicKeyArgs)}`)
      expect(getPublicKeyArgs).toStrictEqual('testId')
      verify(mockApiClient.getPublicKey(anything(), anything())).once()
    })
  })
})
