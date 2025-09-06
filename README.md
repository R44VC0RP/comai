<div align="center">
  <div>
    <img src=".github/screenshot.png" alt="AI Commits"/>
	<h1 align="center">ComAI</h1>
  </div>
	<p>A CLI that writes your git commit messages for you with AI. Never write a commit message again.</p>
	<a href="https://www.npmjs.com/package/comai"><img src="https://img.shields.io/npm/v/comai" alt="Current version"></a>
</div>

---

(thanks to Nutlopes for developing most of this, but I wanted to keep it updated with newer models and some quality of life changes)

## Setup

> The minimum supported version of Node.js is the latest v14. Check your Node.js version with `node --version`.

1. Install _comai_:

   ```sh
   npm install -g comai
   ```

2. Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys)

   > Note: If you haven't already, you'll have to create an account and set up billing.

3. Set the key so comai can use it:

   ```sh
   comai config set OPENAI_KEY=<your token>
   ```

   This will create a `.comai` file in your home directory.

### Upgrading

Check the installed version with:

```
comai --version
```

If it's not the [latest version](https://github.com/R44VC0RP/comai/releases/latest), run:

```sh
npm update -g comai
```

## Usage

### CLI mode

You can call `comai` directly to generate a commit message for your staged changes:

```sh
git add <files...>
comai
```

`comai` passes down unknown flags to `git commit`, so you can pass in [`commit` flags](https://git-scm.com/docs/git-commit).

For example, you can stage all changes in tracked files with as you commit:

```sh
comai --all # or -a
```

#### Generate multiple recommendations

Sometimes the recommended commit message isn't the best so you want it to generate a few to pick from. You can generate multiple commit messages at once by passing in the `--generate <i>` flag, where 'i' is the number of generated messages:

```sh
comai --generate <i> # or -g <i>
```

> Warning: this uses more tokens, meaning it costs more.

#### Generating Conventional Commits

If you'd like to generate [Conventional Commits](https://conventionalcommits.org/), you can use the `--type` flag followed by `conventional`. This will prompt `comai` to format the commit message according to the Conventional Commits specification:

```sh
comai --type conventional # or -t conventional
```

This feature can be useful if your project follows the Conventional Commits standard or if you're using tools that rely on this commit format.

### Git hook

You can also integrate _comai_ with Git via the [`prepare-commit-msg`](https://git-scm.com/docs/githooks#_prepare_commit_msg) hook. This lets you use Git like you normally would, and edit the commit message before committing.

#### Install

In the Git repository you want to install the hook in:

```sh
comai hook install
```

#### Uninstall

In the Git repository you want to uninstall the hook from:

```sh
comai hook uninstall
```

#### Usage

1. Stage your files and commit:

   ```sh
   git add <files...>
   git commit # Only generates a message when it's not passed in
   ```

   > If you ever want to write your own message instead of generating one, you can simply pass one in: `git commit -m "My message"`

2. Comai will generate the commit message for you and pass it back to Git. Git will open it with the [configured editor](https://docs.github.com/en/get-started/getting-started-with-git/associating-text-editors-with-git) for you to review/edit it.

3. Save and close the editor to commit!

## CLI Options

You can set persistent CLI options so you don't have to specify flags every time you run `comai`.

### Managing CLI Options

#### Show current options
```sh
comai options
# or
comai options show
```

#### Set options
```sh
comai options set all=true
comai options set generate=3
comai options set type=conventional
comai options set exclude=package-lock.json,dist/
```

#### Get specific options
```sh
comai options get all
comai options get generate
```

#### Clear options
```sh
comai options clear all
comai options clear generate
```

### Available Options

- **all**: `true|false` - Automatically stage all tracked files (equivalent to `--all` flag)
- **exclude**: `file1,file2` - Comma-separated list of files to exclude (equivalent to `--exclude` flag)
- **generate**: `1-5` - Number of commit messages to generate (equivalent to `--generate` flag)
- **type**: `conventional` - Type of commit message format (equivalent to `--type` flag)

### How it works

Once you set options, `comai` will use them as defaults every time you run it. CLI flags will always override stored options.

For example:
```sh
# Set preferences
comai options set all=true generate=2

# This will use your stored preferences
comai

# This will override the stored generate setting for this run only
comai --generate 5
```

## Configuration

### Reading a configuration value

To retrieve a configuration option, use the command:

```sh
comai config get <key>
```

For example, to retrieve the API key, you can use:

```sh
comai config get OPENAI_KEY
```

You can also retrieve multiple configuration options at once by separating them with spaces:

```sh
comai config get OPENAI_KEY generate
```

### Setting a configuration value

To set a configuration option, use the command:

```sh
comai config set <key>=<value>
```

For example, to set the API key, you can use:

```sh
comai config set OPENAI_KEY=<your-api-key>
```

You can also set multiple configuration options at once by separating them with spaces, like

```sh
comai config set OPENAI_KEY=<your-api-key> generate=3 locale=en
```

### Options

#### OPENAI_KEY

Required

The OpenAI API key. You can retrieve it from [OpenAI API Keys page](https://platform.openai.com/account/api-keys).

#### locale

Default: `en`

The locale to use for the generated commit messages. Consult the list of codes in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes.

#### generate

Default: `1`

The number of commit messages to generate to pick from.

Note, this will use more tokens as it generates more results.

#### proxy

Set a HTTP/HTTPS proxy to use for requests.

To clear the proxy option, you can use the command (note the empty value after the equals sign):

```sh
comai config set proxy=
```

#### model

Default: `gpt-5`

The Chat Completions (`/v1/chat/completions`) model to use. Consult the list of models available in the [OpenAI Documentation](https://platform.openai.com/docs/models/model-endpoint-compatibility).

> Tip: The default model is now `gpt-5`. You can also use [`gpt-4`](https://platform.openai.com/docs/models/gpt-4) or other models if needed. Check out OpenAI's website to learn more about model capabilities and pricing.

#### timeout

The timeout for network requests to the OpenAI API in milliseconds.

Default: `10000` (10 seconds)

```sh
comai config set timeout=20000 # 20s
```

#### max-length

The maximum character length of the generated commit message.

Default: `50`

```sh
comai config set max-length=100
```

#### type

Default: `""` (Empty string)

The type of commit message to generate. Set this to "conventional" to generate commit messages that follow the Conventional Commits specification:

```sh
comai config set type=conventional
```

You can clear this option by setting it to an empty string:

```sh
comai config set type=
```

## How it works

This CLI tool runs `git diff` to grab all your latest code changes, sends them to OpenAI's GPT-5, then returns the AI generated commit message.

Video coming soon where I rebuild it from scratch to show you how to easily build your own CLI tools powered by AI.

## Maintainers

- **Ryan Vogel**: [@R44VC0RP](https://github.com/R44VC0RP)


## Contributing

If you want to help fix a bug or implement a feature in [Issues](https://github.com/R44VC0RP/comai/issues), checkout the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project
