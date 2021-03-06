const log = require('evillogger')({ ns:'methods' });
const klawSync = require('klaw-sync');
const path = require('path');

const methods = {};
const methodsDescriptor = {};
const reDirname = new RegExp(__dirname+'/');
const showLog = !process.mainModule.filename.match(/\/cli/);

let cmdName;
let cmdBase;

let file;
for (file of klawSync(path.resolve(__dirname+'/handlers'), { depthLimit:1, nodir:true })) {

    if (file.path.match(/README/)) {
        continue;
    }

    cmdName = path.basename(file.path).replace(/\.js/, '');
    cmdBase = file.path.replace(reDirname, '').replace(/\.js/, '');
    if (cmdBase.match(/\//)) {
        cmdBase = cmdBase.split('/')[1];
    }
    showLog && log.debug(`method registered ${cmdBase}/${cmdName}`);
    methods[cmdName] = require(file.path);
    methodsDescriptor[cmdName] = methods[cmdName].getDescriptor();
}

function getHandler(method, params, context) {
    if (!methods[method]) {
        return;
    }

    if (context) {
        return methods[method].handle.bind(context);
    } else {
        return methods[method].handle;
    }
}

function list() {
    return methods;
}

function listWithDescriptor() {
    return methodsDescriptor;
}


function exists(method) {
    if (methods[method]) {
        return true;
    }
    return false;
}

function exec(method, params, context, callback) {
    try {
        methods[method].handle(params, context, callback);
    } catch(err) {
        callback(err);
    }
}

module.exports = {
    list,
    listWithDescriptor,
    exists,
    getHandler,
    exec
};
