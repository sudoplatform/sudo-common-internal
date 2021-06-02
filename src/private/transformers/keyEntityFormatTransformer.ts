import {
  IllegalArgumentError,
  PublicKeyFormat,
} from '@sudoplatform/sudo-common'
import { KeyFormat as KeyFormatGraphQL } from '../../gen/graphqlTypes'
import { PublicKeyEntityFormat } from '../../public/types/publicKeyEntity'

export default class KeyEntityFormatTransformer {
  transformGraphQL(data?: KeyFormatGraphQL): PublicKeyEntityFormat {
    switch (data) {
      case KeyFormatGraphQL.Spki:
        return PublicKeyEntityFormat.SPKI
      case undefined:
      case KeyFormatGraphQL.RsaPublicKey:
        return PublicKeyEntityFormat.RSAPublicKey
      default:
        throw new IllegalArgumentError(`Unrecognized GraphQL KeyFormat ${data}`)
    }
  }

  transformEntity(data: PublicKeyEntityFormat): KeyFormatGraphQL {
    switch (data) {
      case PublicKeyEntityFormat.SPKI:
        return KeyFormatGraphQL.Spki
      case PublicKeyEntityFormat.RSAPublicKey:
        return KeyFormatGraphQL.RsaPublicKey
      default:
        throw new IllegalArgumentError(`Unrecognized Entity KeyFormat ${data}`)
    }
  }

  transformKeyManager(data: PublicKeyFormat): PublicKeyEntityFormat {
    switch (data) {
      case PublicKeyFormat.SPKI:
        return PublicKeyEntityFormat.SPKI
      case PublicKeyFormat.RSAPublicKey:
        return PublicKeyEntityFormat.RSAPublicKey
      default: {
        throw new IllegalArgumentError(
          `Unrecognized KeyManager PublicKeyFormat ${data}`,
        )
      }
    }
  }
}
