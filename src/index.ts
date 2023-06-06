import dotenv from 'dotenv';
dotenv.config();
import { server } from './server.js';
const port = (process.env.NODE_PORT || 5009);
server.listen(port, () => console.log('listening on port 5009...'))
