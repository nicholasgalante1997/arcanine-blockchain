import dotenv from 'dotenv';
import { server } from './server.js';
import { logger } from './logger.js';

dotenv.config();
const port = process.env.PORT || 5009;
server.listen(port, () => logger.info(`listening on port ${port}...`));
