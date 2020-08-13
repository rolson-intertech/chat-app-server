import { MasterServer, IServerPlugin } from "./master-server.server";
import Express from 'express';
import * as path from 'path';

/** Server plugin that serves static files.  NOTE: This should be the LAST plugin
 *   registered with the master server, because it will handle 404 errors when routes are not found. */
export class WebServerPlugin implements IServerPlugin {
    constructor(contentPath: string) {
        this.contentPath = contentPath;
    }

    /** Full path to the root folder of files that this webserver will be serving from.
     *   NOTE: This will be our client's output files. */
    private readonly contentPath: string;

    /** The MasterServer that owns this plugin. */
    masterServer: MasterServer;

    initialize(): void {
        // Do nothing.
    }

    registerRoutes(): void {
        // We want to direct calls to the root of our site to our index.html file.
        //  NOTE: This MUST come before the registration of EXPRESS.static middleware below, or it won't work.
        this.masterServer.expressApp.get('/', (req, res) => {
            res.sendFile(path.join(this.contentPath, 'index.html'));
        });

        // This will cause express to serve file requests from matching files found in the contentPath.
        this.masterServer.expressApp.get('*', Express.static(this.contentPath));
    }

}