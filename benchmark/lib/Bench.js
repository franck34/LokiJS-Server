const shared = require('./shared');

class Bench {

    constructor() {
        this.title='define me';
        this.dbName = '__bench';
        this.collectionName = 'c';
        this.data = shared.data();
    }

    static get title() {
        return this.title;
    }

    static onClientError(err) {
        console.log(err);
        process.exit();
    }

    static prepareClient(callback) {
        const Client = require('sloki-node-client');
        this.client = new Client('tcp://127.0.0.1');
        try {
            (async () => {
                await this.client.connect();
                await this.client.loadDatabase({ db:this.dbName, o:{ autosave:false } }, callback);
            })();
        } catch (e) {
            throw e;
        }

        this.client.on('error', this.onClientError);
    }


    bench(client, callback) {
        // override me !
        this.client = client;
        this.callback = callback;
        shared.start();
        shared.stop();
        if (callback) {
            this.callback();
        }
    }

    start(test) {
        shared.start(test);
    }

    stop(test, callback) {
        shared.stop(test, callback);
    }

    run() {

        if (!this.client) {
            this.prepareClient(() => {
                this.bench(this.client);
            });
            return;
        }

        this.bench();

    }
}

module.exports = Bench;