import Express from 'express';
import bodyParser from "body-parser";
import * as http from 'http';

/** General form of a server plugin. */
export interface IServerPlugin {

    /** The MasterServer that owns this plugin. */
    masterServer: MasterServer;

    /** Allows this plugin to initialize itself */
    initialize(): void;

    /** Allows this plugin to register its routes with the application. */
    registerRoutes(): void;
}

/** Responsible for implementing multiple plugins that supports our overall server capabilities. */
export class MasterServer {
    constructor(portNumber: number, plugins: Array<IServerPlugin>) {
        this.plugins = plugins;
        this.portNumber = portNumber;

        // Perform initialization.
        this.initialize();
    }


    private _httpServer: http.Server;
    /** Returns the underlying node HTTP server used for communications with the client. */
    get httpServer(): http.Server {
        return this._httpServer;
    }

    private _expressApp: Express.Application;
    /** The Express application that handles the pipeline and server calls. */
    get expressApp(): Express.Application {
        return this._expressApp;
    }

    /** Array of plugins that add arbitrary functionality to the server. 
     *   This is set in our constructor.    */
    private readonly plugins: Array<IServerPlugin>;

    /** The port number that our server runs on. */
    readonly portNumber: number;

    /** Initializes this server object, and all of the plugins. */
    private initialize(): void {
        // Create the new express app.
        this._expressApp = require('express')();

        // Socket.IO needs access to the underlying http server.  This provides that.
        this._httpServer = require('http').createServer(this.expressApp);

        // Without this, our requests don't have a body when received from the clients.
        //  This allows for special cases, the body stream may not simply be text.
        this.expressApp.use(bodyParser.text());

        /** This is responsible for taking parameters in URL queries, and 
         *   placing them in the Params of our requests when they are received. */
        this.expressApp.use(Express.urlencoded({}));

        // We just want to print something to the console with every request here.
        this.expressApp.use((req, res, next) => {
            // Log this to the console.
            console.log(`Received Request: ${req.path}, ${req.ip}`);

            // This tells express that our function (middleware) didn't completely handle the request and to
            //  keep searching for a function that does.  Without it, no other middleware is called after this.
            next();
        });

        // Initialize the plugins.
        this.initializePlugins();

        // Register their endpoints.
        this.registerPluginEndpoints();
    }

    /** Perform initialization of the plugins, allowing them to register their routes and perform
     *   any other setup needed. */
    private initializePlugins(): void {
        this.plugins.forEach(p => {
            // Set the owner on this plugin, and then let it initialize.
            p.masterServer = this;
            console.log(`Initializing Plugin: ${p.constructor.name}`);
            p.initialize();
        });
    }

    /** Registers all endpoints on the plugins. */
    private registerPluginEndpoints(): void {
        this.plugins.forEach(p => {
            console.log(`Registering routes for: ${p.constructor.name}`);
            p.registerRoutes();
        });
    }

    /** Starts the server listening for server requests. */
    listen(): void {
        this.httpServer.listen(this.portNumber);
    }
}