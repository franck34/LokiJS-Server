const log = require('evillogger')({ ns:'server/maxClients' });
const Method = require('../../Method');

const descriptor = {
    title:'maxClients',
    description:'Return or set maximum number of allowed simultaneous connected clients (TCP/TLS)',
    properties:{
        'value':{
            description:'Maximum number of allowed simultaneous connected clients (between 1 and 1000)',
            type:'number',
            minimum: 1,
            maximum: 1000,
        }
    }
};

function handler(params, context, callback) {
    if (!params.value) {
        callback(null, context.server.getMaxClients());
        return;
    }

    const maxClients = params.value;

    context.server.setMaxClients(maxClients);
    log.info(`${context.session.id}: maxClients has been set to ${maxClients} in engine ${context.server.engine}`);
    callback(null, maxClients);
}

module.exports = new Method(descriptor, handler);
