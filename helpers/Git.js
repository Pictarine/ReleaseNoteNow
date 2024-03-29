const { Octokit } = require("@octokit/rest")

module.exports = class Git {
  constructor({ owner, repo, branch, prefix, token }) {
    this.repo = { owner, repo }
    this.branch = branch
    this.prefix = prefix
    this.octokit = new Octokit({ auth: token })
    this.responseHandler = (response) => response.data
  }
  async getLatestRelease() {
    if (this.prefix.length == 0) {
      return this.octokit
      .repos
      .getLatestRelease(this.repo)
      .then(this.responseHandler)
      .then(responseData => {
        const result = {
          name: responseData.name,
          tag: responseData.tag_name
        }
        return result
      })
    } else {
      const self = this
      const internalGetLatestRelease = async({ page, per_page }) => {
       return self.octokit
       .repos
       .listReleases(Object.assign({ page, per_page }, self.repo))
       .then(this.responseHandler)
       .then(responseData => {
         const releases = responseData.map(releaseData => {
           return {
             name: releaseData.name,
             tag: releaseData.tag_name
           }
         })
         for (const release of releases) {
           if (release.tag.startsWith(self.prefix + '_')) {
             return release
           }
         }
         if (releases.length < per_page) {
           return null
         } else {
           return internalGetLatestRelease({ page: page+1, per_page })
         }
       })
     }
     return internalGetLatestRelease({ page: 1, per_page: 100})    }
  }
  async getTagByName({ tag }) {
    const self = this
    return this.octokit
      .git
      .getRef(Object.assign({ ref: `tags/${tag}` }, this.repo))
      .then(this.responseHandler)
      .then(responseData => {
        // NOTE: This is necessary because the tag-ref SHA can be different from associated commit SHA
        return self.octokit
          .git
          .getTag(Object.assign({ tag_sha: responseData.object.sha }, self.repo))
          .catch(() => {
            // NOTE: If it's the same, the catch will just return the same SHA, without the GET /Tag
            return { data: { object: { sha: responseData.object.sha } } }
          })
      })
      .then(responseData => {
        return self.octokit
          .git
          .getCommit(Object.assign({ commit_sha: responseData.data.object.sha }, self.repo))
      })
      .then(this.responseHandler)
      .then(responseData => {
        const tagInfo = {
          id: tag,
          sha: responseData.sha,
          date: responseData.committer.date
        }
        return tagInfo
      })
  }
  async getCommits({ until }) {
    const self = this
    const internalGetCommits = async({ searchedCommits, until }) => {
      const lastCommit = searchedCommits.length === 0 ? this.branch : searchedCommits[searchedCommits.length-1].sha
      return self.octokit
        .repos
        .listCommits(lastCommit ? Object.assign({ sha: lastCommit }, self.repo) : self.repo)
        .then(self.responseHandler)
        .then(responseData => {
          const commits = responseData.map(commitData => {
            return {
              sha: commitData.sha,
              message: commitData.commit.message,
              author: commitData.commit.author.email
            }
          })
          let isLimitReached = false
          for (const commit of commits) {
            if (commit.sha === until) {
              isLimitReached = true
              break
            }
            searchedCommits.push(commit)
          }
          if (isLimitReached === true) {
            return searchedCommits
          } else {
            return internalGetCommits({ searchedCommits, until })
          }
        })
    }
    return internalGetCommits({ searchedCommits: [], until })
  }
  async getFileContent({ path }) {
    return this.octokit
      .repos
      .getContent(Object.assign({ path }, this.repo))
      .then(responseData => {
        const fileContent = Buffer.from(
          responseData.data.content,
          'base64'
        ).toString()
        return Promise.resolve(fileContent)
      })
  }
  async createRelease({ branch, name, tag, markdown }) {
    this.octokit
      .repos
      .createRelease(Object.assign({ tag_name: tag, name, target_commitish: branch, body: markdown }, this.repo))
  }
}
