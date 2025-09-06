import OpenAI from 'openai';
import { KnownError } from './error.js';
import type { CommitType } from './config.js';
import { generatePrompt } from './prompt.js';

const sanitizeMessage = (message: string) =>
	message
		.trim()
		.replace(/[\n\r]/g, '')
		.replace(/(\w)\.$/, '$1');

const deduplicateMessages = (array: string[]) => Array.from(new Set(array));

export const generateCommitMessage = async (
	apiKey: string,
	model: string,
	locale: string,
	diff: string,
	completions: number,
	maxLength: number,
	type: CommitType,
	timeout: number,
	proxy?: string
) => {
	try {
		// Initialize OpenAI client
		const clientOptions: OpenAI.ClientOptions = {
			apiKey,
			timeout,
		};

		// Add proxy support if provided
		if (proxy) {
			const { HttpsProxyAgent } = await import('https-proxy-agent');
			clientOptions.httpAgent = new HttpsProxyAgent(proxy);
		}

		const client = new OpenAI(clientOptions);

		// Generate the system prompt
		const instructions = generatePrompt(locale, maxLength, type);

		// Generate multiple responses by making multiple requests
		const requestPromises = [];
		for (let i = 0; i < completions; i++) {
			requestPromises.push(
				client.responses.create({
					model,
					instructions,
					input: diff,
				})
			);
		}

		// Wait for all requests to complete
		const responses = await Promise.all(requestPromises);
		
		// Extract text from all responses
		let messages: string[] = [];
		
		for (const response of responses) {
			if (response.output_text) {
				// Use the convenience property if available
				messages.push(response.output_text);
			} else if (response.output && Array.isArray(response.output)) {
				// Otherwise, extract from the output array
				for (const outputItem of response.output) {
					if (outputItem.type === 'message' && outputItem.role === 'assistant') {
						for (const contentItem of outputItem.content) {
							if (contentItem.type === 'output_text' && contentItem.text) {
								messages.push(contentItem.text);
							}
						}
					}
				}
			}
		}

		// Process and return messages
		return deduplicateMessages(
			messages
				.filter(message => message && message.trim().length > 0)
				.map(message => sanitizeMessage(message))
		);
	} catch (error) {
		const errorAsAny = error as any;
		
		// Handle network errors
		if (errorAsAny.code === 'ENOTFOUND') {
			throw new KnownError(
				`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`
			);
		}

		// Handle OpenAI API errors
		if (errorAsAny instanceof OpenAI.APIError) {
			let errorMessage = `OpenAI API Error: ${errorAsAny.status} - ${errorAsAny.message}`;
			
			if (errorAsAny.status === 500) {
				errorMessage += '\n\nCheck the API status: https://status.openai.com';
			}
			
			throw new KnownError(errorMessage);
		}

		throw errorAsAny;
	}
};