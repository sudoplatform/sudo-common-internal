import gql from 'graphql-tag'
import { paginatedPublicKeyFragment, publicKeyFragment } from './fragments'

export const generateGetPublicKeyForServiceQuery = (serviceName: string) =>
  gql`
  query getPublicKeyFor${serviceName}($keyId: String!) {
    getPublicKeyFor${serviceName}(keyId: $keyId) {
      ...PublicKey
    }
  }
  ${publicKeyFragment}
  `

export const generateGetKeyRingForServiceQuery = (serviceName: string) =>
  gql`
    query getKeyRingFor${serviceName}(
        $keyRingId: String!,
        $limit: Int,
        $nextToken: String,
      ) {
        getKeyRingFor${serviceName}(keyRingId: $keyRingId, limit: $limit, nextToken: $nextToken) {
          ...PaginatedPublicKey
        }
      }
      ${paginatedPublicKeyFragment}
  `
