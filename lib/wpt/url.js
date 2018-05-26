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
    const $ = cheerio.load('html');
    return $('script').last().html();
  }

  async getAssets() {
    const { cli, request } = this;
    const tree = new GitHubTree(cli, request, {
      owner: 'w3c',
      repo: 'web-platform-tests',
      branch: 'master',
      path: 'url'
    });

    const prefix = await tree.getUrlPrefix();
    console.log(prefix);
    const data = await Promise.all([
      ...json.map(file => this.pair(request, prefix, file, 'json')),
      ...scripts.map(file => this.pair(request, prefix, file, 'script'))
    ]);
    return data;
  }

  async update(base) {
    const data = await this.getAssets();
    for (const item of data) {
      const dest = item.type === 'json'
        ? item.name : item.name.replace(/\.html$/, '.js');
      writeFile(path.join(base, dest), item.content);
    }
  }
}

module.exports = URLTestsUpdater;
