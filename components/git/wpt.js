'use strict';

const yargs = require('yargs');
const Request = require('../../lib/request');
const CLI = require('../../lib/cli');
const auth = require('../../lib/auth');
const URLTestUpdater = require('../../lib/wpt/url');
const { runPromise } = require('../../lib/run');

// web-platform-tests/url/file: node/test/fixtures/wpt/url/file

function builder(yargs) {
  return yargs
    .positional('name', {
      describe: 'Subset of the WPT to update, e.g. \'url\'',
      type: 'string'
    })
    .options({
      dest: {
        describe: 'Directory the assets will be put under',
        type: 'string',
        default: '.ncu/cache/wpt'
      }
    });
}

async function url(argv) {
  const cli = new CLI();
  const credentials = await auth();
  const request = new Request(credentials);
  const updater = new URLTestUpdater(cli, request);
  await updater.writeFiles(argv.dest);
}

function handler(argv) {
  if (argv.name === 'url') {
    runPromise(url(argv));
  } else {
    yargs.showHelp();
  }
}

module.exports = {
  command: 'wpt <name>',
  describe: 'Updates WPT suite',
  builder,
  handler
};
