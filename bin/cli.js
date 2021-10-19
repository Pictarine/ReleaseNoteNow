#!/usr/bin/env node
const yargs = require('yargs')
const releaseNoteNow = require('../index')
const logger = require('../helpers/logger')

const args = yargs
  .version(false)
  .usage('Usage: $0 -t [github_token] -r [owner/repository] -b [target_branch] -p [release_prefix] -k [prefix_keys] -v [new_version] -s [message_style]')
  .option('token', {
    alias: 't',
    demandOption: true,
    describe: 'GitHub Token'
  })
  .option('repo', {
    alias: 'r',
    demandOption: true,
    describe: 'GitHub repository (owner/repo)'
  })
  .option('branch', {
    alias: 'b',
    demandOption: false,
    describe: 'Name of the branch to release'
  })
  .option('keys', {
    alias: 'k',
    demandOption: true,
    default: 'feat:Features,fix:Fixes'
  })
  .option('version', {
    alias: 'v',
    demandOption: true
  })
  .option('style', {
    alias: 's',
    demandOption: false,
    describe: 'Commit message to markdown conversion style: short/full',
    default: 'full'
  })
  .option('prefix', {
    alias: 'p',
    demandOption: false,
    describe: 'Prefix filter for release names',
    default: ''
  })
  .fail((...args) => {
    const [message, error, yargs] = args
    logger.error(error || `${message}\n\n${yargs.help()}`)
    process.exit(1)
  })
  .help()
  .strict()
  .argv

releaseNoteNow({
  token: args.token,
  repo: args.repo,
  keys: args.keys,
  versionType: args.version,
  branch: args.branch,
  style: args.style,
  prefix: args.prefix
})
