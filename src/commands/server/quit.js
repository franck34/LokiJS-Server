const Command = require('../Command');


let descriptor = {
    name:"quit",
    categories:["client"],
    description:{
        short:"Disconnect",
    },
    parameters:[]
}

/**
 * client disconnect
 *
 * @example
 * > quit
 * bye
 *
 * @param {object} params - not used
 * @param {function} callback - callback
 * @memberof Commands
 */
 function handler(params, callback, socket) {
     callback(null, "bye");
     socket.end();
}

module.exports = new Command(descriptor, handler);
