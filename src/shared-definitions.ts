/* API endpoints for our server to respond to.  NOTE that these values are completely arbitrary. */
export const EP_GET_ALL_MESSAGES = '/api/get-all-messages';
export const EP_SEND_NEW_MESSAGE = '/api/send-message';

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

/** Returns a boolean value indicating whether or not a specified value
 *   is a string that holds a JSON date/time. */
export function isDateString(val: any): boolean {
    // It must be a string to check it.
    if (typeof val !== 'string') {
        return false;
    }

    // Check its pattern.
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(val);
}

/** Converts any string property that is formatted date/time, on a specified object,
 *   or nested objects, to an actual date. */
export function convertDates(target: any): void {
    // Arrays work differently.  Check this explicitly.
    if (Array.isArray(target)) {
        // Convert properties on this array.
        for (var i = 0; i < target.length; i++) {
            if (isDateString(target[i])) {
                // Convert this value.
                target[i] = new Date(target[i]);
            } else if (target[i] != null && typeof target[i] === 'object') {
                // Convert dates on this this nested item.
                convertDates(target[i]);
            }
        }

        // We can only work on non-null objects.
    } else if (target != null && typeof target === 'object') {
        // Check the properties on the target.
        for (var n in target) {
            if (isDateString(target[n])) {
                // Convert it.
                target[n] = new Date(target[n]);
            } else if (typeof target[n] === 'object' && target[n] != null) {
                // Convert nested values on this object.
                convertDates(target[n]);
            }
        }
    }

}