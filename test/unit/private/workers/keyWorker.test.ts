import {
  DecodeError,
  DefaultLogger,
  DefaultSudoKeyManager,
  FatalError,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { DefaultKeyWorker } from '../../../../src/private/workers/keyWorker'
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import * as _ from 'lodash'
import { KeyDataFactory } from '../../data-factory/keyDataFactory'

const str2ab = (name: string): ArrayBuffer => {
  return new TextEncoder().encode(name).buffer
}

describe('DefaultKeyWorker test suite', () => {
  let instanceUnderTest: DefaultKeyWorker
  const logger = new DefaultLogger()
  const mockSudoKeyManager = mock<DefaultSudoKeyManager>()
  const mockSudoUserClient = mock<SudoUserClient>()
  const keyPairIdKey = 'testCommonKeyPair'
  const keyRingServiceName = 'testCommonService'
  const sub = 'testCommonOwner'

  beforeEach(() => {
    reset(mockSudoUserClient)
    reset(mockSudoKeyManager)

    instanceUnderTest = new DefaultKeyWorker(
      instance(mockSudoKeyManager),
      instance(mockSudoUserClient),
      keyPairIdKey,
      keyRingServiceName,
    )
    when(mockSudoKeyManager.getPassword(anything())).thenResolve(undefined)
    when(mockSudoKeyManager.getPublicKey(anything())).thenResolve(
      KeyDataFactory.keyManagerPublicKey,
    )
    when(mockSudoUserClient.getSubject()).thenResolve(sub)
  })

  it('getCurrentPublicKey returns undefined when there is no currentPublicKey', async () => {
    logger.debug('testing')
    when(mockSudoKeyManager.getPublicKey(anything())).thenResolve(undefined)
    await expect(
      instanceUnderTest.getCurrentPublicKey(),
    ).resolves.toBeUndefined()
    verify(mockSudoUserClient.getSubject()).never()

    const [getPasswordArgs] = capture(mockSudoKeyManager.getPassword).first()
    expect(getPasswordArgs).toEqual(keyPairIdKey)
    verify(mockSudoKeyManager.getPassword(anything())).once()

    verify(mockSudoKeyManager.getPublicKey(anything())).never()
  })

  it('generateKeyPair returns the expected public key', async () => {
    when(mockSudoKeyManager.addPassword(anything(), anything())).thenResolve()
    when(mockSudoKeyManager.generateKeyPair(anything())).thenResolve()

    when(mockSudoKeyManager.getPublicKey(anything())).thenResolve(
      KeyDataFactory.keyManagerPublicKey,
    )
    const generatedPublicKey = await instanceUnderTest.generateKeyPair()
    logger.debug(`currentPublicKey is ${JSON.stringify(generatedPublicKey)}`)
    expect(_.omit(generatedPublicKey, ['keyId'])).toEqual(
      _.omit(KeyDataFactory.generatedPublicKeyEntity, ['keyId']),
    )
    verify(mockSudoUserClient.getSubject()).once()

    verify(mockSudoKeyManager.addPassword(anything(), anything())).once()

    verify(mockSudoKeyManager.getPublicKey(anything())).once()
  })

  it('getCurrentPublicKey returns previously generated PublicKey', async () => {
    when(mockSudoKeyManager.addPassword(anything(), anything())).thenResolve()
    when(mockSudoKeyManager.generateKeyPair(anything())).thenResolve()

    const generatedPublicKey = await instanceUnderTest.generateKeyPair()
    logger.debug(`currentPublicKey is ${JSON.stringify(generatedPublicKey)}`)
    expect(_.omit(generatedPublicKey, ['keyId'])).toEqual(
      _.omit(KeyDataFactory.generatedPublicKeyEntity, ['keyId']),
    )
    const currentPublicKey = await instanceUnderTest.getCurrentPublicKey()
    expect(currentPublicKey).toStrictEqual(generatedPublicKey)
    verify(mockSudoUserClient.getSubject()).once()

    verify(mockSudoKeyManager.addPassword(anything(), anything())).once()

    verify(mockSudoKeyManager.getPublicKey(anything())).once()
  })

  it('getCurrentPublicKey returns previously saved PublicKey', async () => {
    const testKeyPairIdString = 'testKeyPairId'
    const testKeyPairId = new TextEncoder().encode(testKeyPairIdString)
    when(mockSudoKeyManager.getPassword(anything())).thenResolve(testKeyPairId)
    when(mockSudoKeyManager.getPublicKey(anything())).thenResolve(
      KeyDataFactory.keyManagerPublicKey,
    )

    const currentPublicKey = await instanceUnderTest.getCurrentPublicKey()
    logger.debug(`currentPublicKey is ${JSON.stringify(currentPublicKey)}`)
    expect(currentPublicKey?.keyId).toEqual(testKeyPairIdString)
    expect(currentPublicKey?.keyRingId).toEqual(
      KeyDataFactory.generatedPublicKeyEntity.keyRingId,
    )

    verify(mockSudoKeyManager.getPassword(anything())).once()
    verify(mockSudoKeyManager.getPublicKey(anything())).once()
    verify(mockSudoUserClient.getSubject()).once()
  })

  describe('unsealString', () => {
    it('throws InternalError if currentPublicKey returns undefined', async () => {
      await expect(
        instanceUnderTest.unsealString({
          encrypted: '',
          keyId: '',
          algorithm: '',
        }),
      ).rejects.toStrictEqual(new FatalError('Key not generated'))
    })

    it('throws DecodeError when decrypt fails', async () => {
      when(mockSudoKeyManager.getPassword(anyString())).thenResolve(
        str2ab('aa'),
      )
      when(
        mockSudoKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).thenReject(new Error('error'))
      await expect(
        instanceUnderTest.unsealString({
          encrypted: '',
          keyId: '',
          algorithm: '',
        }),
      ).rejects.toStrictEqual(
        new DecodeError('Could not decrypt AES key from sealed string'),
      )
    })

    it('throws DecodeError when decrypt private key returns undefined', async () => {
      when(mockSudoKeyManager.getPassword(anyString())).thenResolve(
        str2ab('aa'),
      )
      when(
        mockSudoKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).thenResolve(undefined)
      await expect(
        instanceUnderTest.unsealString({
          encrypted: '',
          keyId: '',
          algorithm: '',
        }),
      ).rejects.toStrictEqual(
        new DecodeError('Could not extract AES key from sealed string'),
      )
    })
    it('throws DecodeError when decrypt symmetric key fails', async () => {
      when(mockSudoKeyManager.getPassword(anyString())).thenResolve(
        str2ab('aa'),
      )
      when(
        mockSudoKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).thenResolve(str2ab('decryptedPriv'))
      when(
        mockSudoKeyManager.decryptWithSymmetricKey(anything(), anything()),
      ).thenReject(new Error('error'))
      await expect(
        instanceUnderTest.unsealString({
          encrypted: '',
          keyId: '',
          algorithm: '',
        }),
      ).rejects.toStrictEqual(
        new DecodeError('Could not unseal sealed payload'),
      )
    })
    it('calls through everything expected', async () => {
      when(mockSudoKeyManager.getPassword(anyString())).thenResolve(
        str2ab('aa'),
      )
      when(
        mockSudoKeyManager.decryptWithSymmetricKey(anything(), anything()),
      ).thenResolve(str2ab('decryptedSym'))
      when(
        mockSudoKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).thenResolve(str2ab('cipherKey'))
      const cipherString = 'aabbccddeeff'
      await expect(
        instanceUnderTest.unsealString({
          encrypted: Buffer.from(
            `${new Array(256 + 1).join('0')}${cipherString}`,
          ).toString('base64'),
          keyId: 'keyId',
          algorithm: 'algorithm',
        }),
      ).resolves.toStrictEqual('decryptedSym')
      verify(
        mockSudoKeyManager.decryptWithPrivateKey(anything(), anything()),
      ).once()
      const [inputKeyId, encrypted] = capture(
        mockSudoKeyManager.decryptWithPrivateKey,
      ).first()
      expect(inputKeyId).toStrictEqual('keyId')
      const expectedBuffer = Buffer.from(new Array(256 + 1).join('0'), 'base64')
      // This is expected due to the way buffers need to be converted from Buffer -> ArrayBuffer
      expect(encrypted).toStrictEqual(
        expectedBuffer.buffer.slice(
          expectedBuffer.byteOffset,
          expectedBuffer.byteOffset + expectedBuffer.byteLength,
        ),
      )
      verify(
        mockSudoKeyManager.decryptWithSymmetricKey(anything(), anything()),
      ).once()
      const [cipherKey, encryptedData] = capture(
        mockSudoKeyManager.decryptWithSymmetricKey,
      ).first()
      expect(cipherKey).toStrictEqual(str2ab('cipherKey'))
      const expectedEncryptedData = Buffer.from(cipherString, 'base64')
      expect(encryptedData).toStrictEqual(
        expectedEncryptedData.buffer.slice(
          expectedEncryptedData.byteOffset,
          expectedEncryptedData.byteOffset + expectedEncryptedData.byteLength,
        ),
      )
    })
  })
})
