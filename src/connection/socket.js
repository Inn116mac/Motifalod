import { io } from 'socket.io-client';
const SERVER_URL = 'http://65.49.60.248:3000';
export const socket = io(SERVER_URL, { autoConnect: false });
