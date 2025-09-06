import { command } from 'cleye';
import { red, green, cyan, bold } from 'kolorist';
import { hasOwn, getConfig, setConfigs } from '../utils/config.js';
import { KnownError, handleCliError } from '../utils/error.js';

// CLI flag options that can be stored as preferences
const cliOptions = ['all', 'exclude', 'generate', 'type'] as const;

export default command(
	{
		name: 'options',
		alias: ['opts', 'prefs'],
		parameters: ['[mode]', '[key=value...]'],
	},
	(argv) => {
		(async () => {
			const { mode, keyValue: keyValues } = argv._;

			if (!mode || mode === 'show') {
				// Show current options
				const config = await getConfig({}, false, ['OPENAI_KEY']);
				console.log(`${cyan(bold('Current CLI Options:'))}\n`);
				
				for (const option of cliOptions) {
					const value = config[option as keyof typeof config];
					// Show the option if it has a non-default value
					const hasValue = value !== undefined && value !== null && 
						(Array.isArray(value) ? value.length > 0 : 
						 typeof value === 'boolean' ? value !== false :
						 typeof value === 'number' ? value !== 1 :
						 typeof value === 'string' ? value !== '' : true);
					
					if (hasValue) {
						const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
						console.log(`  ${option}=${displayValue}`);
					}
				}
				
				console.log(`\n${cyan('Usage:')}`);
				console.log(`  comai options set <key>=<value>  Set a CLI option preference`);
				console.log(`  comai options get <key>          Get a CLI option value`);
				console.log(`  comai options clear <key>        Clear a CLI option preference`);
				console.log(`  comai options show               Show all current options (default)`);
				console.log(`\n${cyan('Available options:')}`);
				console.log(`  all=true|false       Auto-stage all tracked files`);
				console.log(`  exclude=file1,file2  Files to exclude from analysis`);
				console.log(`  generate=1-5         Number of messages to generate`);
				console.log(`  type=conventional    Type of commit message format`);
				return;
			}

			if (mode === 'get') {
				const config = await getConfig({}, false, ['OPENAI_KEY']);
				for (const key of keyValues) {
					if (cliOptions.includes(key as any)) {
						const value = config[key as keyof typeof config];
						if (value !== undefined && value !== null) {
							const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
							console.log(`${key}=${displayValue}`);
						} else {
							console.log(`${key}=<not set>`);
						}
					} else {
						console.log(`${key}=<not set>`);
					}
				}
				return;
			}

			if (mode === 'set') {
				const validKeyValues: [string, string][] = [];
				for (const keyValue of keyValues) {
					const [key, value] = keyValue.split('=') as [string, string];
					if (!cliOptions.includes(key as any)) {
						throw new KnownError(`Invalid CLI option: ${key}. Valid options are: ${cliOptions.join(', ')}`);
					}
					validKeyValues.push([key, value]);
				}
				
				await setConfigs(validKeyValues);
				console.log(`${green('✓')} CLI options updated successfully`);
				return;
			}

			if (mode === 'clear') {
				const validKeyValues: [string, string][] = [];
				for (const key of keyValues) {
					if (!cliOptions.includes(key as any)) {
						throw new KnownError(`Invalid CLI option: ${key}. Valid options are: ${cliOptions.join(', ')}`);
					}
					// Set empty value to clear
					validKeyValues.push([key, '']);
				}
				
				await setConfigs(validKeyValues);
				console.log(`${green('✓')} CLI options cleared successfully`);
				return;
			}

			throw new KnownError(`Invalid mode: ${mode}. Use 'show', 'get', 'set', or 'clear'.`);
		})().catch((error) => {
			console.error(`${red('✖')} ${error.message}`);
			handleCliError(error);
			process.exit(1);
		});
	}
);
