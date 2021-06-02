export interface PublicKeyEntity {
  /**
   * Id associated with the key pair.
   */
  keyId: string

  /**
   * Key ring id associated with the key pair.
   */
  keyRingId: string

  /**
   * Format of the key.
   */
  keyFormat: PublicKeyEntityFormat

  /**
   * Data of the key.
   */
  keyData: string
}

export enum PublicKeyEntityFormat {
  SPKI,
  RSAPublicKey,
}
