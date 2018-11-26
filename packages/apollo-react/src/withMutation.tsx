import * as React from 'react';
import { ComponentType } from 'react';
import { DocumentNode } from 'graphql/language';
import { FetchResult } from 'apollo-link';

import {
  ApolloClient,
  MutationOptions as ApolloMutationOptions,
} from 'apollo-client';

import {
  Mutation,
  MutationProps as ApolloMutationProps,
  MutationFn,
  MutationResult,
  OperationVariables,
} from 'react-apollo';

export interface MutationProps<TData, TVars>
  extends Partial<ApolloMutationProps<TData, TVars>> {
  mutation?: never;
  children: (
    mutateFn: MutationFn<TData, TVars>,
    result: MutationResult<TData>
  ) => React.ReactNode;
}

export interface MutationOptions<TVars> extends Partial<ApolloMutationOptions> {
  mutation?: never;
  variables?: TVars;
}

export interface MutationOperation<TData, TVars> {
  document: DocumentNode;

  Mutation: ComponentType<MutationProps<TData, TVars>>;

  mutate: <TCache>(
    client: ApolloClient<TCache>,
    options?: MutationOptions<TVars>
  ) => Promise<FetchResult<TCache>>;
}

export function withMutation<TData = any, TVars = OperationVariables>(
  mutation: DocumentNode
): MutationOperation<TData, TVars> {
  return {
    document: mutation,

    Mutation(props: MutationProps<TData, TVars>) {
      return <Mutation {...props} mutation={mutation} />;
    },

    mutate<TCache>(
      client: ApolloClient<TCache>,
      options?: MutationOptions<TVars>
    ) {
      return client.mutate<TCache>({ ...options, mutation });
    },
  };
}
