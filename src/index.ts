
import { WebServerPlugin } from "./web-server.plugin";
import { MasterServer } from "./master.server";
import { ChatServerPlugin } from "./chat-server.plugin";
import * as path from 'path';

/** Connection string to our MongoDB. */
const mongoDbConnectionString = 'mongodb://localhost/chat-app';

/** Path to our client files.  This should be the folder with the index.html,
 *   which is in the *output* of our client application.  (Not the public folder.) */
const staticFileLocation = path.join(__dirname, '../..', 'client/build');

// Create our plugins for use in the master server.
const chatPlugin = new ChatServerPlugin(mongoDbConnectionString);
const webServerPlugin = new WebServerPlugin(staticFileLocation);

// Create and initialize the master server.
const masterServer = new MasterServer(
    // When developing in react, this port number should not be the same as the dev server.
    //  It will act as a proxy server during development, but in production, we'll use port 80, and it will
    //  indeed serve the front-end files.
    3001,
    [chatPlugin,
        // WARNING: Make sure this is always the LAST item in the plugin set, or it will consider
        //  any requests it doesn't handle as 404 requests (not found).
        webServerPlugin]);

// Start listening for requests.
masterServer.listen();