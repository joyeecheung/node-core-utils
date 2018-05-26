'use strict';

const yargs = require('yargs');
const Request = require('../../lib/request');
const CLI = require('../../lib/cli');
const auth = require('../../lib/auth');
const URLTestUpdater = require('../../lib/wpt/url');
const { runPromise } = require('../../lib/run');

// web-platform-tests/url/${src}: node/test/fixtures/web-platform-tests/url/${dest}
const base = '.ncu/cache/wpt';

function builder(yargs) {
  return yargs
    .positional('name', {
      describe: 'Subset of the WPT to update, e.g. \'url\'',
      type: 'string'
    });
}

async function url() {
  const cli = new CLI();
  const credentials = await auth();
  const request = new Request(credentials);
  const updater = new URLTestUpdater(cli, request);
  await updater.update(base);
}

function handler(argv) {
  if (argv.name === 'url') {
    runPromise(url());
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
