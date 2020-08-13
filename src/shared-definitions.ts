/* API endpoints for our server to respond to.  NOTE that these values are completely arbitrary. */
export const EP_GET_ALL_MESSAGES = 'api/get-all-messages';
export const EP_SEND_NEW_MESSAGE = 'api/send-message';

/* Socket.IO messages to respond to.  These values are also completely arbitrary. */
export const MSG_SEND_MESSAGE = 'send-message';
export const MSG_MESSAGE_RECEIVED = 'message-received';


/** The form of a chat message. */
export interface IChatMessage {
    /** Database ID of the message.
     *   NOTE: We're cheating a little here.  We want to share this file
     *   with the client, and the client can't reference MongoDB.  We pass this
     *   to the client as a string, and covert it back on the server to an ObjectID. */
    _id?: any;

    /** Date/Time that the message was made. */
    dateTime: Date;

    /** The name of the person who sent the message. */
    senderName: string;

    /** The message body. */
    message: string;
}
