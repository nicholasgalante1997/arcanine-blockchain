import { pino } from 'pino';

export const logger = pino({
    name: 'arcanine-logger',
    base: undefined,
    transport: {
        target: 'pino-pretty'
    }
});