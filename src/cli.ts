import { cli } from 'cleye';
import { description, version } from '../package.json';
import aicommits from './commands/aicommits.js';
import prepareCommitMessageHook from './commands/prepare-commit-msg-hook.js';
import configCommand from './commands/config.js';
import hookCommand, { isCalledFromGitHook } from './commands/hook.js';
import optionsCommand from './commands/options.js';

const rawArgv = process.argv.slice(2);

cli(
	{
		name: 'comai',

		version,

		/**
		 * Since this is a wrapper around `git commit`,
		 * flags should not overlap with it
		 * https://git-scm.com/docs/git-commit
		 */
		flags: {
			generate: {
				type: Number,
				description:
					'Number of messages to generate (Warning: generating multiple costs more) (default: 1)',
				alias: 'g',
			},
			exclude: {
				type: [String],
				description: 'Files to exclude from AI analysis',
				alias: 'x',
			},
			all: {
				type: Boolean,
				description:
					'Automatically stage changes in tracked files for the commit',
				alias: 'a',
				default: false,
			},
			type: {
				type: String,
				description: 'Type of commit message to generate',
				alias: 't',
			},
		},

		commands: [configCommand, hookCommand, optionsCommand],

		help: {
			description,
		},

		ignoreArgv: (type) => type === 'unknown-flag' || type === 'argument',
	},
	async (argv) => {
		if (isCalledFromGitHook) {
			prepareCommitMessageHook();
		} else {
			// Import getConfig here to avoid circular imports
			const { getConfig } = await import('./utils/config.js');
			
			// Get stored preferences
			const config = await getConfig({}, false, ['OPENAI_KEY']);
			
			// Merge CLI flags with stored preferences (CLI flags take precedence)
			const generate = argv.flags.generate ?? config.generate;
			const exclude = argv.flags.exclude ?? config.exclude;
			const all = argv.flags.all ?? config.all;
			const type = argv.flags.type ?? config.type;
			
			aicommits(
				generate,
				exclude,
				all,
				type,
				rawArgv
			);
		}
	},
	rawArgv
);
