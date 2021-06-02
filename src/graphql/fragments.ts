import gql from 'graphql-tag'

export const publicKeyFragment = gql`
  fragment PublicKey on PublicKey {
    id
    keyId
    keyRingId
    algorithm
    keyFormat
    publicKey
    owner
    version
    createdAtEpochMs
    updatedAtEpochMs
  }
`

export const paginatedPublicKeyFragment = gql`
  fragment PaginatedPublicKey on PaginatedPublicKey {
    items {
      ...PublicKey
    }
    nextToken
  }
`
