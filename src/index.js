import http from 'http';
import socket_io from 'socket.io';

const server = http.createServer();
server.listen(3015);
log('Server is listening on port 3015');
const io = socket_io();
io.attach(server);
io.on('connection', onConnectionHandler);

global.users = {
  teacher: {
    name: 'teacher',
    online: false,
    pass: 'wfksj374FeNslw42',
    token: 'J2x2O2dRsO8VR17e6tIpggCqS83hsqrDEz9bCxjP214E1A2naR0EE2kjDSHM4pKtyo78PrpvkNKIqODHp1NN8X1fiuLnr1CNIWxrpTCF3eEJxxoVIv0m7BSdYvuvaXvw',
    sockets: []
  },
  student: {
    name: 'student',
    online: false,
    pass: 'Eo97Vq4YXBFf14jH',
    token: 'flUfMMFbJteDPhQsQIaiQ92uteAsb3EGHA1Gkx7Bp9vKv8o2B6PBQ6I0GdtpP2IYjLQ8swXgqx2SJzLIux2wukDdfulgEqcbWgm91wGERwrcI4Mulhi5nZ6HNIq84Dtz',
    sockets: []
  }
};
global.clients = {};

const E_AUTHORISE = 'authorise';
const E_AUTHENTICATE = 'authenticate';
const E_CHAT = 'chat';
const E_SHAPE = 'shape';
const E_DATA = 'data';
const E_JOINED = 'joined';
const E_STATUS = 'check-status';
const E_COMMAND = 'command';

const _CLASSROOM = 'classroom';


function onConnectionHandler(socket) {
  log('Socket connected: ' + socket.id);
  global.clients[socket.id] = socket.id;
  socket.on(E_AUTHORISE, (data) => {
    const { name, pass } = data || {};
    global.clients[socket.id] = name;
    const user = global.users[name];
    if (!user || user.pass !== pass) {
      socket.emit(E_AUTHORISE, { status: 'err', data: { message: 'Wrong name or password!' } });
      log(`[${name}]: authorisation failed`);
    } else {
      log(`[${name}]: authorisation successfully`);
      user.sockets.push(socket.id);
      user.online = true;
      socket.emit(E_AUTHORISE, { status: 'ok', data: { token: user.token, name } });
      socket.join(_CLASSROOM, () => {
        log(`[${name}]: joined to [${_CLASSROOM}]`);
        io.to(_CLASSROOM).emit(E_JOINED, { status: 'ok', room: _CLASSROOM });
        io.to(_CLASSROOM).emit(E_STATUS, { online: user.online, name: user.name });
      });
    }
  });
  socket.on(E_AUTHENTICATE, (data) => {
    const { name, token } = data || {};
    global.clients[socket.id] = name;
    const user = global.users[name];
    if (!user || user.token !== token) {
      log(`[${name}]: authentication failed`);
      socket.emit(E_AUTHENTICATE, { status: 'err', data: { message: 'Wrong name or token!' } });
    } else {
      log(`[${name}]: authentication successfully`);
      user.sockets.push(socket.id);
      user.online = true;
      socket.emit(E_AUTHENTICATE, { status: 'ok' });
      socket.join(_CLASSROOM, () => {
        log(`[${name}]: joined to [${_CLASSROOM}]`);
        io.to(_CLASSROOM).emit(E_JOINED, { status: 'ok', room: _CLASSROOM, name });
        io.to(_CLASSROOM).emit(E_STATUS, { online: user.online, name: user.name });
      });
    }
  });

  socket.on(E_COMMAND, ({ command, payload }) => {
    log(`command [${command}] sent`);
    io.to(_CLASSROOM).emit(E_COMMAND, { command, payload });
  });
  socket.on(E_CHAT, ({ name, message }) => {
    log(`[${name}]: sent message`);
    io.to(_CLASSROOM).emit(E_CHAT, { name, message });
  });
  socket.on(E_STATUS, ({ name }) => {
    const user = global.users[name];
    log(`[${name}]: requested status`);
    socket.emit(E_STATUS, { online: user.online, name: user.name });
  });
  socket.on(E_SHAPE, ({ name, shape }) => {
    log(`[${name}]: sent shape`);
    io.to(_CLASSROOM).emit(E_SHAPE, { name, shape });
  });
  socket.on(E_DATA, ({ name, data }) => {
    log(`[${name}]: sent data`);
    io.to(_CLASSROOM).emit(E_DATA, { name, data });
  });
  socket.on('disconnect', () => {
    const name = global.clients[socket.id];
    log(`[${name}]: ${socket.id} disconnected`);
    const user = global.users[name];
    if (user) {
      user.online = false;
      user.sockets = user.sockets.filter((id) => id !== socket.id);
      delete global.clients[socket.id]
    }
  });
}

function log(text) {
  const time = new Date();
  console.log(`[${time.toLocaleTimeString()}] ${text}`);
}
