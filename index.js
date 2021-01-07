const Git = require('./helpers/Git')
const logger = require('./helpers/logger')
const MarkdownGenerator = require('./generators/Markdown')
const versionEvaluator = require('./version/versionEvaluator')

module.exports = async({ token, repo, branch, keys, versionType }) => {
  try {
    const [owner, repoName] = repo.split('/')
    const git = new Git({ owner, repo: repoName, token })
    const release = await git
      .getLatestRelease()
      .then(release => {
        logger.print(`> Latest release found on GitHub: ${logger.highlight(release.name)}`)
        logger.print(`Fetching commits since tag ${logger.bold(release.tag)}...`)
        return release
      })
    const tag = await git.getTagByName({ tag: release.tag })
    const commits = await git
      .getCommits({ until: tag.sha })
      .then(commits => {
        logger.print(`> ${logger.highlight(`${commits.length} commits`)} found since latest release`)
        return commits
      })
    const version = await versionEvaluator.evaluate({
      type: versionType,
      oldTag: release.tag,
      git
    })
    const markdown = MarkdownGenerator.generate({
      keys, owner, repo: repoName, oldTag: release.tag, newTag: version.tag, commits
    })
    await git.createRelease({ branch, name: version.name, tag: version.tag, markdown })
    logger.success(`Release ${logger.bold(version.tag)} generated successfully.`)
  } catch (error) {
    logger.error(error)
  }
}
