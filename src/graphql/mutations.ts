import gql from 'graphql-tag'
import { publicKeyFragment } from './fragments'

export const generateCreatePublicKeyForServiceMutation = (
  serviceName: string,
) =>
  gql`
  mutation createPublicKeyFor${serviceName}($input: CreatePublicKeyInput!) {
    createPublicKeyFor${serviceName}(input: $input) {
      ...PublicKey
    }
  }
  ${publicKeyFragment}
  `
