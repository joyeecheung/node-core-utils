'use strict';

const GitHubTree = require('../github/tree');
const path = require('path');
const { writeFile } = require('../file');
const cheerio = require('cheerio');

const json = [
  'urltestdata.json',
  'setters_tests.json',
  'toascii.json'
];

const scripts = [
  'url-constructor.html',
  'url-tojson.htmll',
  'urlsearchparams-append.html',
  'urlsearchparams-constructor.html',
  'urlsearchparams-delete.html',
  'urlsearchparams-foreach.html',
  'urlsearchparams-getall.html',
  'urlsearchparams-get.html',
  'urlsearchparams-has.html',
  'urlsearchparams-set.html',
  'urlsearchparams-sort.html',
  'urlsearchparams-stringifier.html'
];

function generateReadme(tree) {
  return `# Web Platform Test Assets

The assets here are generated with \`git node wpt url --dest /path/to/fixtures/wpt\`.
Modifications to them should be upstreamed to ${tree.repoUrl} first.

License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
Origin of the last update: ${tree.pathUrl}
`;
}

class URLTestsUpdater {
  constructor(cli, request) {
    this.cli = cli;
    this.request = request;
  }

  async pair(request, prefix, name, type) {
    const content = await request.text(`${prefix}/${name}`);
    return {
      name,
      type,
      content: type === 'json' ? content : this.getLastScript(content)
    };
  }

  getLastScript(html) {
    const $ = cheerio.load(html);
    return $('script').last().html();
  }

  async getAssets() {
    const { cli, request } = this;
    const tree = new GitHubTree(cli, request, {
      owner: 'web-platform-tests',
      repo: 'wpt',
      branch: 'master',
      path: 'url'
    });

    const prefix = await tree.getUrlPrefix();
    cli.log(`Downloading assets of ${tree.pathUrl}`);
    const data = await Promise.all([
      ...json.map(file => this.pair(request, prefix, file, 'json')),
      ...scripts.map(file => this.pair(request, prefix, file, 'script'))
    ]);
    data.push({
      name: 'README.md',
      type: 'markdown',
      content: generateReadme(tree)
    });
    return data;
  }

  async writeFiles(dest) {
    const data = await this.getAssets();
    for (const item of data) {
      let name = item.name;
      if (item.type === 'script') {
        name = item.name.replace(/\.html$/, '.js');
      }
      writeFile(path.join(dest, name), item.content);
    }
    this.cli.log(`Written files to ${dest}`);
  }
}

module.exports = URLTestsUpdater;
