import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscribers = new Map();
    }

    connect(url, userId, onConnectCallback) {
        if (this.connected) return;
        
        const socket = new SockJS(`${url}/ws`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null; 

        this.stompClient.connect({}, (frame) => {
            this.connected = true;
            console.log("🚀 Neural Link Established");
            this.stompClient.send("/app/addNewUser", {}, JSON.stringify({ userId }));
            if (onConnectCallback) onConnectCallback();
        }, (error) => {
            console.error("❌ Neural Link Failed: ", error);
            setTimeout(() => this.connect(url, userId, onConnectCallback), 5000);
        });
    }

    subscribe(topic, callback) {
        if (this.stompClient && this.connected) {
            return this.stompClient.subscribe(topic, (message) => {
                callback(JSON.parse(message.body));
            });
        }
    }

    disconnect() {
        if (this.stompClient !== null && this.connected) {
            this.stompClient.disconnect();
            this.connected = false;
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;