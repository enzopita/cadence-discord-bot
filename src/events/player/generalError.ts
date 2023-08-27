import config from 'config';
import { BotOptions, EmbedOptions, SystemOptions } from '../../types/configTypes';
const embedOptions: EmbedOptions = config.get('embedOptions');
const botOptions: BotOptions = config.get('botOptions');
const systemOptions: SystemOptions = config.get('systemOptions');
import { BaseGuildTextChannel, EmbedBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import loggerModule from '../../services/logger';
import { ExtendedGuildQueuePlayerNode } from '../../types/eventTypes';

// Emitted when the player queue encounters error (general error with queue)
module.exports = {
    name: 'error',
    isDebug: false,
    isPlayerEvent: true,
    execute: async (queue: ExtendedGuildQueuePlayerNode, error: Error) => {
        const executionId = uuidv4();
        const logger = loggerModule.child({
            source: 'generalError.js',
            module: 'event',
            name: 'playerGeneralError',
            executionId: executionId,
            shardId: queue.metadata?.client.shard?.ids[0],
            guildId: queue.metadata?.channel.guild.id
        });

        logger.error(error, "player.events.on('error'): Player queue encountered error event");

        await queue.metadata?.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `**${embedOptions.icons.error} Uh-oh... _Something_ went wrong!**\nIt seems there was an issue related to the queue or current track.\n\nIf you performed a command, you can try again.\n\n_If this problem persists, please submit a bug report in the **[support server](${botOptions.serverInviteUrl})**._`
                    )
                    .setColor(embedOptions.colors.error)
                    .setFooter({ text: `Execution ID: ${executionId}` })
            ]
        });

        if (systemOptions.systemMessageChannelId && systemOptions.systemUserId) {
            const channel = (await queue.metadata?.client.channels.cache.get(
                systemOptions.systemMessageChannelId
            )) as BaseGuildTextChannel;
            if (channel) {
                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `${embedOptions.icons.error} **player.events.on('error')**\nExecution id: ${executionId}\n${error.message}` +
                                    `\n\n<@${systemOptions.systemUserId}>`
                            )
                            .setColor(embedOptions.colors.error)
                            .setFooter({ text: `Execution ID: ${executionId}` })
                    ]
                });
            }
        }
    }
};
