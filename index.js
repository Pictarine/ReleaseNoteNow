const Git = require('./helpers/Git')
const logger = require('./helpers/logger')
const MarkdownGenerator = require('./generators/Markdown')
const versionEvaluator = require('./version/versionEvaluator')

module.exports = async({ token, repo, branch, prefix, keys, versionType, style }) => {
  try {
    const [owner, repoName] = repo.split('/')
    const git = new Git({ owner, repo: repoName, branch, prefix, token })
    const release = await git
      .getLatestRelease()
    if (release === null) {
      logger.error('No previous release found!')
      return
    }
    logger.print(`> Latest release found on GitHub: ${logger.highlight(release.name)}`)
    logger.print(`Fetching commits since tag ${logger.bold(release.tag)}...`)
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
      prefix: prefix,
      git
    })
    const markdown = MarkdownGenerator.generate({
      keys, owner, repo: repoName, oldTag: release.tag, newTag: version.tag, commits, style
    })
    await git.createRelease({ branch, name: version.name, tag: version.tag, markdown })
    logger.success(`Release ${logger.bold(version.tag)} generated successfully.`)
  } catch (error) {
    logger.error(error)
  }
}
