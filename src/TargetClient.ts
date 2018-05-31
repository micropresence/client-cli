import WebSocket from "ws";
import {Logger} from "pino";

import {WebSocketMessenger, clientRegistration, HttpOverWebSocket} from "@micropresence/protocol";
import {once} from "./utils/eventEmitterUtils";

type AuthToken = string;

export interface Config {
    server: string;
    redirectHost: string;
    targetHost: string;
}

export class TargetClient {
    private ws: WebSocket = new WebSocket(this.config.server);
    private wsMessenger = new WebSocketMessenger(this.ws);
    // @ts-ignore
    private authToken: AuthToken | null = null;
    private httpOverWs = new HttpOverWebSocket(this.ws);

    constructor(private config: Config, private log: Logger) {
        this.ws.on("message", message => this.log.debug("message", message));

        this.httpOverWs.initRequestFulfillment(config.targetHost);
    }

    async register(): Promise<clientRegistration.Response> {
        await once(this.ws, "open");
        this.log.debug("open");
        const {messageType, message: response} = await this.wsMessenger.request<clientRegistration.Request, any>(
            clientRegistration.channel,
            clientRegistration.MessageType.Request,
            {redirectHost: this.config.redirectHost}
        );
        if (clientRegistration.isOk(messageType, response)) {
            this.authToken = response.authToken;
            return response;
        } else if (clientRegistration.isRejection(messageType, response)) {
            this.close();
            return response;
        } else {
            this.close();
            throw new Error("Unexpected registration response");
        }
    }

    close() {
        this.ws.close();
    }
}
