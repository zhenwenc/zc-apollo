import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

import { parse, execute, GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

import {
  printSchema,
  buildClientSchema,
  introspectionQuery,
} from 'graphql/utilities';

const fetch = require('isomorphic-unfetch');
const { fileLoader, mergeTypes } = require('merge-graphql-schemas');

async function fetchRemoteSchema(url: string, insecure: boolean) {
  const agent =
    /^https:\/\//i.test(url) && insecure
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;
  const body = JSON.stringify({ query: introspectionQuery });
  const method = 'POST';
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      agent,
      method,
      headers,
      body,
    });
    const result = await response.json();

    if (result.errors) {
      throw new Error(`Errors in introspection query result: ${result.errors}`);
    }
    if (!result.data) {
      throw new Error(
        `No introspection query result data from: ${JSON.stringify(result)}`
      );
    }
    return printSchema(buildClientSchema(result.data));
  } catch (e) {
    throw new Error(`Error while fetching introspection query: ${e.message}`);
  }
}

// Copy from graphql-js library, released in new version
// https://github.com/graphql/graphql-js/blob/master/src/utilities/introspectionFromSchema.js
async function introspectionFromSchema(schema: GraphQLSchema) {
  const queryAST = parse(introspectionQuery);
  const result = await execute(schema, queryAST);
  return result.data; /* IntrospectionQuery */
}

export async function introspectSchema(
  remoteURL: string,
  clientURL: string,
  output?: string,
  insecure: boolean = true
) {
  const rootDir = path.resolve(path.basename(__dirname), '../');
  const clientSchema = fileLoader(path.resolve(rootDir, clientURL));
  const remoteSchema = /^https?:\/\//i.test(remoteURL)
    ? await fetchRemoteSchema(remoteURL, insecure)
    : fileLoader(remoteURL);

  const typeDefs = mergeTypes([...clientSchema, remoteSchema]);
  const schema = makeExecutableSchema({ typeDefs });
  const introspection = await introspectionFromSchema(schema);

  const json = JSON.stringify(introspection, null, 2);
  if (output) fs.writeFileSync(output, json);

  return json;
}
