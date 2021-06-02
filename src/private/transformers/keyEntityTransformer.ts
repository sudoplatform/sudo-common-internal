import { PublicKey } from '@sudoplatform/sudo-common'
import { PublicKey as PublicKeyGraphQL } from '../../gen/graphqlTypes'
import { PublicKeyEntity } from '../../public/types/publicKeyEntity'
import KeyEntityFormatTransformer from './keyEntityFormatTransformer'

export default class KeyEntityTransformer {
  private readonly keyEntityFormatTransformer = new KeyEntityFormatTransformer()
  transformGraphQL(data: PublicKeyGraphQL): PublicKeyEntity {
    return {
      keyId: data.keyId,
      keyRingId: data.keyRingId,
      keyFormat: this.keyEntityFormatTransformer.transformGraphQL(
        data.keyFormat,
      ),
      keyData: data.publicKey,
    }
  }

  transformKeyManager(
    publicKey: PublicKey,
    keyId: string,
    keyRingId: string,
  ): PublicKeyEntity {
    return {
      keyId: keyId,
      keyRingId,
      keyFormat: this.keyEntityFormatTransformer.transformKeyManager(
        publicKey.keyFormat,
      ),
      keyData: Buffer.from(publicKey.keyData).toString('base64'),
    }
  }
}
