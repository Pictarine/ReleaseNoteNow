module.exports = class Markdown {
  static generate({ keys, owner, repo, oldTag, newTag, commits }) {
    const keysObject = keys.split(',').reduce((object, key) => {
      const [keyId, keyName] = key.split(':')
      return Object.assign(object, { [keyId]: keyName })
    }, {})
    const searchableKeys = Object.keys(keysObject)
    const commitGroups = searchableKeys.reduce((result, key) => {
      return Object.assign(result, { [key]: [] })
    }, {})
    // Sorting commits by keys
    const evaluatedGroups = commits.reduce((previousGroups, commit) => {
      const message = commit.message
      const markStart = message.indexOf('[')
      const markEnd = message.indexOf(']')
      if (markStart !== 0 || markEnd === -1) {
        return previousGroups
      }
      const mark = message.substring(markStart + 1, markEnd).trim().toLowerCase()
      if (searchableKeys.includes(mark)) {
        const displayableMessage = message.substring(markEnd + 1).trim()
        const markdownText = `* [${displayableMessage}](https://github.com/${owner}/${repo}/commit/${commit.sha})`
        previousGroups[mark].push(markdownText)
      }
      return previousGroups
    }, commitGroups)
    // Generating markdown
    const result = [
      '# Commits',
      `[Différence avec la version ${oldTag}](https://github.com/${owner}/${repo}/compare/${oldTag}...${newTag})`
    ]
    searchableKeys.forEach(key => {
      result.push(`## ${keysObject[key]}`)
      commitGroups[key].forEach(commit => result.push(commit))
    })
    return result.join('\n')
  }
}
