import * as React from 'react';
import { ComponentType } from 'react';
import { DocumentNode } from 'graphql/language';
import { DataProxy } from 'apollo-cache';

import {
  ApolloClient,
  ApolloQueryResult,
  WatchQueryOptions,
} from 'apollo-client';
import {
  Query,
  QueryProps as ApolloQueryProps,
  QueryResult,
  OperationVariables,
} from 'react-apollo';

export interface QueryProps<T, V> extends Partial<ApolloQueryProps<T, V>> {
  query?: never;
  children: (result: QueryResult<T, V>) => React.ReactNode;
}

export interface QueryOptions<T> extends Partial<WatchQueryOptions> {
  query?: never;
  variables?: T;
}

export interface QueryReadOptions<T> extends Partial<DataProxy.Query<T>> {
  query?: never;
  variables?: T;
}

export interface QueryWriteOptions<T, V>
  extends Partial<DataProxy.WriteQueryOptions<T, V>> {
  query?: never;
  data: T;
  variables?: V;
}

export interface QueryOperation<TData, TVars> {
  document: DocumentNode;

  Query: ComponentType<QueryProps<TData, TVars>>;

  query: <TCache>(
    client: ApolloClient<TCache>,
    options?: QueryOptions<TVars>
  ) => Promise<ApolloQueryResult<TData>>;

  readQuery: (
    cache: DataProxy,
    options?: QueryReadOptions<TVars>
  ) => TData | null;

  writeQuery: (
    cache: DataProxy,
    options: QueryWriteOptions<TData, TVars>
  ) => void;
}

export function withQuery<TData = any, TVars = OperationVariables>(
  query: DocumentNode
): QueryOperation<TData, TVars> {
  return {
    document: query,

    Query(props: QueryProps<TData, TVars>) {
      return <Query {...props} query={query} />;
    },

    query<TCache>(client: ApolloClient<TCache>, options?: QueryOptions<TVars>) {
      return client.query<TData>(Object.assign({}, options, { query }));
    },

    readQuery(cache: DataProxy, options?: QueryReadOptions<TVars>) {
      return cache.readQuery<TData, TVars>({ ...options, query: query });
    },

    writeQuery(cache: DataProxy, options: QueryWriteOptions<TData, TVars>) {
      return cache.writeQuery({ ...options, query: query });
    },
  };
}
