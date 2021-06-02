/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiClientManager,
  DefaultApiClientManager,
} from '@sudoplatform/sudo-api-client'
import { DefaultLogger, FatalError } from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { FetchPolicy } from 'apollo-client/core/watchQueryOptions'
import AWSAppSyncClient from 'aws-appsync'
import {
  CreatePublicKeyForServiceMutation,
  CreatePublicKeyInput,
  GetKeyRingForServiceQuery,
  GetPublicKeyForServiceQuery,
  PaginatedPublicKey,
  PublicKey,
} from '../../gen/graphqlTypes'
import { generateCreatePublicKeyForServiceMutation } from '../../graphql/mutations'
import {
  generateGetKeyRingForServiceQuery,
  generateGetPublicKeyForServiceQuery,
} from '../../graphql/queries'

export class ApiClient {
  private readonly logger = new DefaultLogger('AppSyncWrapper')
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>
  private readonly serviceName: string

  public constructor(serviceName: string, apiClientManager?: ApiClientManager) {
    const clientManager =
      apiClientManager ?? DefaultApiClientManager.getInstance()
    this.client = clientManager.getClient({ disableOffline: true })
    this.serviceName = serviceName
  }

  public async createPublicKey(
    input: CreatePublicKeyInput,
  ): Promise<PublicKey> {
    const result = await this.client.mutate<CreatePublicKeyForServiceMutation>({
      mutation: generateCreatePublicKeyForServiceMutation(this.serviceName),
      variables: { input },
      fetchPolicy: 'no-cache',
    })

    /*
     * The data comes back on a service specific field createPublicKeyFor${serviceName}
     * which is unknown at compile time, so we have to do some coercion
     */
    const anyData = result.data as any
    const serviceField = `createPublicKeyFor${this.serviceName}`
    if (serviceField in anyData) {
      return anyData[serviceField]
    } else {
      throw new FatalError(
        `createPublicKeyFor${this.serviceName} did not return any result.`,
      )
    }
  }

  public async getKeyRing(
    keyRingId: string,
    fetchPolicy: FetchPolicy,
    limit?: number,
    nextToken?: string,
  ): Promise<PaginatedPublicKey | undefined> {
    const result = await this.client.query<GetKeyRingForServiceQuery>({
      query: generateGetKeyRingForServiceQuery(this.serviceName),
      variables: { keyRingId, limit, nextToken },
      fetchPolicy,
    })

    /*
     * The data comes back on a service specific field getKeyRingFor${serviceName}
     * which is unknown at compile time, so we have to do some coercion
     */
    const anyData = result.data as any
    const serviceField = `getKeyRingFor${this.serviceName}`
    if (serviceField in anyData) {
      return anyData[serviceField]
    } else {
      throw new FatalError(
        `getKeyRingFor${this.serviceName} did not return any result.`,
      )
    }
  }

  public async getPublicKey(
    keyId: string,
    fetchPolicy: FetchPolicy,
  ): Promise<PublicKey | undefined> {
    const result = await this.client.query<GetPublicKeyForServiceQuery>({
      query: generateGetPublicKeyForServiceQuery(this.serviceName),
      variables: { keyId },
      fetchPolicy,
    })

    /*
     * The data comes back on a service specific field getPublicKeyFor${serviceName}
     * which is unknown at compile time, so we have to do some coercion
     */
    const anyData = result.data as any
    const serviceField = `getPublicKeyFor${this.serviceName}`
    return serviceField in anyData ? anyData[serviceField] : undefined
  }
}
