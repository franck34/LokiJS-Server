const log = require('evillogger')({ns:'transports:tcp'});
const ENV = require('../../env');
const jayson = require('jayson');
const commands = require('../../commands');

const errors = {
    MAX_CLIENT_REACHED:{
        code: -32000,
        message:"Max Clients Reached"
    },
    SERVER_SHUTDOWN:{
        code: -32001,
        message:"Server shutdown"
    }
}

let jaysonServer;
let tcpServer;

function _onServerListen(err) {
    if (err) {
        console.log(err);
        throw new Error(err);
        process.exit(1);
    }

    log.info(
        "TCP Server listening at %s:%s (maxClients %s)",
        ENV.NET_TCP_HOST,
        ENV.NET_TCP_PORT,
        ENV.NET_TCP_MAX_CLIENTS
    );
}

function _handleMaxClients(server, socket) {

    server.options.router = (method, params) => {
        return server.options.routerTcp(method, params, socket);
    }

    socket.id = `${socket.remoteAddress}:${socket.remotePort}`;

    if (_maxClientsReached()) {
        log.warn(
            '%s: refusing connection, number of connection: %s, allowed: %s',
            socket.id,
            tcpServer._connections-1,
            ENV.NET_TCP_MAX_CLIENTS
        );

        // if client is just a tcp connect (prevent kind of slowLoris attack)
        setTimeout(() => {
            socket.end();
        },200);
        return false;
    }

    socket.on('end', () => {
        log.info("%s: client disconnected", socket.id);
        delete tcpServer.clients[socket.id];
    });

    tcpServer.clients[socket.id] = socket;
    log.info("%s: client connected", socket.id);
    return true;
}

function _onConnect(socket) {
    if (_handleMaxClients(this, socket)) {
        socket.loki = {
            currentDatabase:'test'
        };
    }
}

function _maxClientsReached() {
    return tcpServer._connections>ENV.NET_TCP_MAX_CLIENTS;

}

function _maxClientsReachedResponse(params, callback) {
    callback(errors.MAX_CLIENT_REACHED);
}

function start(callback) {

    if (!ENV.NET_TCP_PORT) {
        callback(new Error('ENV.NET_TCP_PORT unavailable'));
        return;
    }

    jaysonServer = jayson.server(
        null, // no handlers, because we are using a router (below)
        {
            routerTcp: (command, params, socket) => {

                if (_maxClientsReached()) {
                    return _maxClientsReachedResponse;
                }

                if (commands.exists(command)) {
                    /*
                    if (params) {
                        log.info('%s: exec %s', socket.id, command, JSON.stringify(params));
                    } else {
                        log.info('%s: exec %s', socket.id, command);
                    }
                    */
                    return commands.getHandler(command, params, socket);
                } else {
                    log.warn('%s: could not find comand %s', socket.id, command);
                }
            }
        }
    );

    tcpServer = jaysonServer.tcp();
    tcpServer.clients = {};
    tcpServer.on('connection', _onConnect);
    tcpServer.on('listening', _onServerListen);
    tcpServer.listen(ENV.NET_TCP_PORT, ENV.NET_TCP_HOST);
    callback && callback();
}

function stop(callback) {
    for (id in tcpServer.clients) {
        tcpServer.clients[id].write(JSON.stringify({error:errors.SERVER_SHUTDOWN}));
        tcpServer.clients[id].end();
        log.warn("%s: force disconnection", id);
        delete tcpServer.clients[id];
    }

    tcpServer.close(() => {
        callback && callback();
    });

}

module.exports = {
    start:start,
    stop:stop
}
