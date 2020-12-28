const chalk = require('chalk')
const log = console.log

module.exports = {
  bold(message) {
    return chalk.bold(message)
  },
  highlight(message) {
    return chalk.yellow(message)
  },
  print(message) {
    log(message)
  },
  success(message) {
    log(chalk.green(`> ${message}`))
  },
  error(message) {
    log(chalk.red(`> ${message}`))
  }
}
