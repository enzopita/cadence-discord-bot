import { Player, SearchResult, useMainPlayer } from 'discord-player';
import { ApplicationCommandOptionChoiceData } from 'discord.js';
import { Logger } from 'pino';
import loggerModule from '../../services/logger';
import { BaseAutocompleteInteraction } from '../../types/interactionTypes';

const loggerTemplate: Logger = loggerModule.child({
    source: 'play.js',
    module: 'autocompleteInteraction',
    name: '/play'
});

// TODO: create interface for recent query object
const recentQueries = new Map();

const autocomplete: BaseAutocompleteInteraction = {
    execute: async ({ interaction, executionId }) => {
        const logger: Logger = loggerTemplate.child({
            executionId: executionId,
            shardId: interaction.guild?.shardId,
            guildId: interaction.guild?.id
        });

        const player: Player = useMainPlayer()!;
        const query: string = interaction.options.getString('query', true);

        const { lastQuery, results, timestamp } = recentQueries.get(interaction.user.id) || {};

        if (lastQuery && (query.startsWith(lastQuery) || lastQuery.startsWith(query)) && Date.now() - timestamp < 500) {
            logger.debug(`Responding with results from lastQuery for query '${query}'`);
            return interaction.respond(results);
        }

        if (query.length < 3) {
            logger.debug(`Responding with empty results due to < 3 length for query '${query}'`);
            return interaction.respond([]);
        }
        const searchResults: SearchResult = await player.search(query);

        let response: ApplicationCommandOptionChoiceData<string>[] = [];

        response = searchResults.tracks.slice(0, 5).map((track) => {
            if (track.url.length > 100) {
                track.url = track.title.slice(0, 100);
            }
            return {
                name:
                    `${track.title} [Author: ${track.author}]`.length > 100
                        ? `${track.title}`.slice(0, 100)
                        : `${track.title} [Author: ${track.author}]`,
                value: track.url
            };
        });

        recentQueries.set(interaction.user.id, {
            lastQuery: query,
            results: response,
            timestamp: Date.now()
        });

        if (!response || response.length === 0) {
            logger.debug(`Responding with empty results for query '${query}'`);
            return interaction.respond([]);
        }

        logger.debug(`Responding to autocomplete with results for query: '${query}'.`);
        return interaction.respond(response);
    }
};

export default autocomplete;
