import { MasterServer, IServerPlugin } from "./master.server";
import { convertDates } from "./shared-definitions";
import { EP_SEND_NEW_MESSAGE } from "./shared-definitions";
import { EP_GET_ALL_MESSAGES, MSG_SEND_MESSAGE, MSG_MESSAGE_RECEIVED, IChatMessage } from "./shared-definitions";
import { MongoClient, Db, ObjectId } from "mongodb";
import * as socketio from 'socket.io';

/** Name of the database collection (table) that holds chat messages. */
const MESSAGE_COLLECTION_NAME = 'messages';

/** Server Plugin that handles chat message handling. */
export class ChatServerPlugin implements IServerPlugin {
    constructor(dbConnectionString: string) {
        this.dbConnectionString = dbConnectionString;
    }

    /** Connection string to our database. */
    readonly dbConnectionString: string;

    /** Database client reference obtained during initialization. */
    private dbClient: MongoClient;

    /** Database reference to our actual database. */
    private db: Db;

    masterServer: MasterServer;

    initialize(): void {
        // Connect our client to the database.
        this.dbClient = new MongoClient(this.dbConnectionString);

        // Connect the client to the server.
        this.dbClient.connect().then(() => {
            // Get the database reference for this.
            this.db = this.dbClient.db();
        });

        // Setup the socket server to respond to realtime messaging.
        this.setupSocketServer();
    }

    registerRoutes(): void {
        // Register a route to get all messages from the database.
        //  This will only respond to request for the POST method, and ignore others.
        //  NOTE: This COULD be implemented using sockets, but it illustrates how API
        //  calls are made.
        this.masterServer.expressApp.post(EP_GET_ALL_MESSAGES, (req, res) => {
            // Get the messages from the database.
            this.getAllMessages().then(result => {
                // Return them to the response.
                res.send(result);
            })
        });

        // Register a route for the user to send a message to the chat.
        this.masterServer.expressApp.post(EP_SEND_NEW_MESSAGE, (req, res) => {
            // Get the body as a message object.
            let message = <IChatMessage>JSON.parse(req.body);

            // Convert date strings on this object to dates.
            convertDates(message);

            // Broadcast the message to others.
            this.socket.emit(MSG_MESSAGE_RECEIVED, message);

            // Save this message to the database.
            this.createMessage(message).then(() => {
                res.end();
            });

        });
    }

    /** Sets up the Socket.IO functionality, along with callbacks for client requests. */
    private setupSocketServer(): void {
        // Create the socket server.
        this.socket = require('socket.io')(this.masterServer.httpServer);

        // When we receive a connection, we need to setup our
        //  callbacks to handlers for those listening.
        this.socket.on('connect', socket => {
            // When the client sends a chat message, we need to broadcast it to everyone, including
            //  the sender.
            socket.on(MSG_SEND_MESSAGE, (message: IChatMessage) => {
                // Store this in the database for later.  Might as well wait until
                //  it has a valid object ID before we send it too.
                this.createMessage(message).then(newId => {
                    // Set the ID on the new message.  It should be a string for clients, since
                    //  they cannot reference the MongoDB api. 
                    message._id = newId.toHexString();

                    // Broadcast the message to all other clients.
                    this.socket.send(MSG_MESSAGE_RECEIVED, message);
                });
            });
        });
    }

    /** The socket.io server that handles realtime messaging. */
    private socket: socketio.Server;

    /** Returns all messages in the database. */
    getAllMessages(): Promise<Array<IChatMessage>> {
        // This will return all messages from the database.
        return this.db.collection(MESSAGE_COLLECTION_NAME).find({}).toArray();
    }

    /** Stores a new message in the database, and returns its object ID. 
     *   This will be called by the chat server, and not handled directly. */
    createMessage(newMessage: IChatMessage): Promise<ObjectId> {
        const res = this.db.collection(MESSAGE_COLLECTION_NAME).insertOne(newMessage);
        return res.then(result => {
            // Return just the object ID from the result.
            return result.insertedId;
        });
    }
}