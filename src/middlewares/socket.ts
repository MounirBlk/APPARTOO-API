import * as socketio from "socket.io"
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default async (io: socketio.Server<DefaultEventsMap, DefaultEventsMap>): Promise<void> => {
    console.log('SocketIO OK !')
    io.on("connection", (socket: socketio.Socket<DefaultEventsMap, DefaultEventsMap>) => {
        //Disconnect
        socket.on("disconnect", () => {
            //TODO
        });
    });
}