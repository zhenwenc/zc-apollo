#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');
const { generate } = require('apollo-codegen');

const { introspectSchema } = require('.');

// Make sure unhandled errors in async code are propagated correctly
process.on('unhandledRejection', error => {
  throw error;
});

process.on('uncaughtException', handleError);

function handleError(error) {
  console.error(error);
  process.exit(1);
}

yargs
  .command(
    ['introspect-schema', 'download-schema'],
    'Generate an introspection JSON from a local GraphQL file or from a remote GraphQL server',
    {
      remote: {
        demand: true,
        describe: 'Remote GraphQL schema URL or files path',
      },
      client: {
        demand: true,
        describe: 'Client GraphQL schema files for apollo-state',
        default: 'stores/**/*.graphql',
      },
      output: {
        demand: true,
        describe: 'Output path for GraphQL schema file',
        default: 'schema.json',
        normalize: true,
        coerce: path.resolve,
      },
      insecure: {
        alias: 'K',
        describe: 'Allows "insecure" SSL connection to the server',
        type: 'boolean',
      },
    },
    async argv => {
      const { remote, client, output, insecure } = argv;
      await introspectSchema(remote, client, output, insecure);
    }
  )
  .command(
    ['generate [input...]', 'generate-react'],
    "Short-hand for 'introspect-schema' && 'generate'",
    {
      remote: {
        demand: true,
        describe: 'Remote GraphQL schema URL or files path',
      },
      client: {
        demand: true,
        describe: 'Client GraphQL schema files for apollo-state',
        default: 'stores/**/*.graphql',
      },
      insecure: {
        alias: 'K',
        describe: 'Allows "insecure" SSL connection to the server',
        type: 'boolean',
      },
      output: {
        demand: true,
        describe: 'Output directory for the generated files',
        default: '__generated__',
        normalize: true,
        coerce: path.resolve,
      },
      target: {
        demand: false,
        describe: 'Code generation target language',
        choices: [
          'swift',
          'scala',
          'json',
          'ts',
          'ts-modern',
          'typescript',
          'typescript-modern',
          'flow',
          'flow-modern',
        ],
        default: 'typescript-modern',
      },
      'tag-name': {
        demand: false,
        describe:
          'Name of the template literal tag used to identify template literals containing GraphQL queries in Javascript/Typescript code',
        default: 'gql',
      },
    },
    async argv => {
      "apollo-codegen generate 'client/**/*.ts' --addTypename --schema client/schema.json --target typescript-modern --output client/graphql/types.d.ts && prettier --write client/graphql/types.d.ts";

      const { input, remote, client, insecure, output, target, tagName } = argv;

      const options = {
        passthroughCustomScalars: false,
        customScalarsPrefix: '',
        addTypename: true, // TypeScript
        generateOperationIds: false,
        mergeInFieldsFromFragmentSpreads: true,
      };

      const schemaOutput = path.join(output, 'schema.json');
      const schema = await introspectSchema(
        remote,
        client,
        schemaOutput,
        insecure
      );

      await generate(
        input,
        schemaOutput,
        output,
        false,
        target,
        tagName,
        undefined,
        options
      );
    }
  )
  .fail(function(message, error) {
    handleError(error ? error : new Error(message));
  })
  .help()
  .version()
  .strict().argv;
