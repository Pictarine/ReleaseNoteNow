const logger = require('../helpers/logger')

// ##################################################
// Version evaluator instance
// ##################################################
const versionEvaluator = {
  register({ key, evaluate }) {
    this.$evaluators = this.$evaluators || {}
    logger.print(`versionEvaluator.register [${logger.bold(key)}]`)
    this.$evaluators[key] = evaluate
  },
  async evaluate({ type, oldTag, prefix, git }) {
    let versionType = type
    let option = null
    if (versionType.includes(':')) {
      const [evaluatedType, evaluatedOption] = versionType.split(':')
      versionType = evaluatedType
      option = evaluatedOption
    }
    const evaluator = this.$evaluators[versionType]
    if (typeof evaluator === 'undefined') {
      return Promise.reject(`Version evaluator [${versionType}] not found`)
    }
    return evaluator({
      oldTag: oldTag,
      option: option,
      prefix: prefix,
      git: git
    })
  }
}

// ##################################################
// VERSION: increment
// ##################################################
versionEvaluator.register({
  key: 'increment',
  evaluate({ oldTag, option, prefix }) {
    const incrementStep = option || '1'
    const oldVersionNumber = prefix.length > 0 ? oldTag.slice(prefix.length + 1) : oldTag
    const newVersionNumber = +oldVersionNumber + +option
    const newTag = prefix.length > 0 ? `${prefix}_${newVersionNumber}` : newVersionNumber
    return {
      name: `Release ${newTag}` + (prefix.length > 0 ? ` (${prefix.capitalize()})` : ``),
      tag: `${newTag}`
    }
  }
})

// ##################################################
// VERSION: xcconfig
// ##################################################
versionEvaluator.register({
  key: 'xcconfig',
  async evaluate({ option, prefix, git }) {
    try {
      const fileContent = await git.getFileContent({ path: option })
      const xcodeVersion = fileContent
        .split('\n')
        .filter(line => line.startsWith('VERSION_NUMBER') || line.startsWith('BUILD_NUMBER'))
        .reduce((previous, line) => {
          const [key, version] = line.split('=').map(part => part.trim())
          previous[key.split('_')[0].toLowerCase()] = version
          return previous
        }, [])
      const newTag = (prefix.length > 0 ? `${prefix}_` : ``) + `${xcodeVersion.version}_${xcodeVersion.build}`
      return {
        name: `Release ${xcodeVersion.version}`+ (prefix.length > 0 ? ` (${prefix.capitalize()} Build ${xcodeVersion.build})` : ` (Build ${xcodeVersion.build})`),
        tag: newTag
      }
    } catch {
      return Promise.reject(`File with path [${option}] not found in repository`)
    }
  }
})

// ##################################################
// VERSION: package.json
// ##################################################
versionEvaluator.register({
  key: 'package.json',
  async evaluate({ option, prefix, git }) {
    const fileContent = await git.getFileContent({ path: option })
    const packageJSON = JSON.parse(fileContent)
    const version = packageJSON.version
    const newTag = (prefix.length > 0 ? `${prefix}_` : ``) + `${version}`
    return {
      name: `Release ${version}` + (prefix.length > 0 ? ` (${prefix.capitalize()})` : ``),
      tag: newTag
    }
  }
})

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = versionEvaluator
