# Release Note Now

Automatic release note generator for GitHub projects.

## Install

Just install as NPM dependency.

```
npm install @pictarine/release-note-now --save
```

## Run

For easy access, add a script into your package.json :

```json
{
  "scripts": {
    "rn": "release-note-now"
  }
}
```

Launch example :

```
npm run rn \
  -- \
  -t ${{ secrets.GITHUB_TOKEN }} \
  -r Pictarine/my_ios_repo \
  -v "xcconfig:Shared/Supporting Files/Main.xcconfig"
```

### Options

```
    --help     Show help                        [boolean]
-t, --token    GitHub Token                     [required]
-r, --repo     GitHub repository (owner/repo)   [required]
-k, --keys                                      [required] [default: "feat:Features,fix:Fixes"]
-v, --version                                   [required]
```

> For the -k option, you can define any key+title that will be searched in commit list.
> - For example, "config:Configuration" will search every commit starting with "[Config]" (uppercased/lowercased), then print them in "Configuration" section in your release note.

> The -v option supports three types of versionning right now:
> - **xcconfig:<path_to_xcconfig>** : Search for an xcconfig file, then extract VERSION_NUMBER + BUILD_NUMBER to generate tag
> - **increment:<increment_count>** : The next tag will increment the last tag + your increment count
> - **package.json:<path_to_file>** : Take the version in package.json file
