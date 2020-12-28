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
  async evaluate({ type, oldTag, git }) {
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
      git: git
    })
  }
}

// ##################################################
// VERSION: increment
// ##################################################
versionEvaluator.register({
  key: 'increment',
  evaluate({ oldTag, option }) {
    const incrementStep = option || '1'
    const newTag = +oldTag + +option
    return {
      name: `Release ${newTag}`,
      tag: newTag
    }
  }
})

// ##################################################
// VERSION: xcconfig
// ##################################################
versionEvaluator.register({
  key: 'xcconfig',
  async evaluate({ option, git }) {
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
      return {
        name: `Release ${xcodeVersion.version} (Build ${xcodeVersion.build})`,
        tag: `${xcodeVersion.version}_${xcodeVersion.build}`
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
  async evaluate({ option }) {
    const fileContent = await git.getFileContent({ path: option })
    const packageJSON = JSON.parse(fileContent)
    const version = packageJSON.version
    return {
      name: `Release ${version}`,
      tag: version
    }
  }
})

module.exports = versionEvaluator
