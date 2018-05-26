'use strict';

const COMMIT_QUERY = 'LastCommit';

class GitHubTree {
  /**
   * If argv.commit is specified, argv.branch will be ignored.
   */
  constructor(cli, request, argv) {
    this.cli = cli;
    this.request = request;
    this.owner = argv.owner;
    this.repo = argv.repo;
    this.branch = argv.branch;
    this.commit = argv.commit;
    this.path = argv.path;
  }

  /**
   * Only valid if argv.branch is specified
   * @returns {string} the hash of the last commit in the tree
   */
  async getLastCommit() {
    const { request, owner, repo, branch, path } = this;
    const data = await request.gql(COMMIT_QUERY, {
      owner,
      repo,
      branch,
      path
    });
    return data.repository.ref.target.history.nodes[0].oid;
  }

  /**
   * Get prefixes for URLs of GitHub assets
   */
  async getUrlPrefix() {
    const base = 'https://raw.githubusercontent.com';
    const { owner, repo, commit, path } = this;
    if (commit) {
      return `${base}/${owner}/${repo}/${commit}/${path}`;
    }
    const lastCommit = await this.getLastCommit();
    return `${base}/${owner}/${repo}/${lastCommit}/${path}`;
  }
}

module.exports = GitHubTree;
