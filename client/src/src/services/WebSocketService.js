import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscribers = new Map();
        // আপনার ব্যাকএন্ড URL
        this.socketUrl = "https://onyx-drift-app-final.onrender.com/ws"; 
    }

    // কানেকশন শুরু করা
    connect(onConnectedCallback) {
        if (this.connected && this.stompClient) return;

        const socket = new SockJS(this.socketUrl);
        this.stompClient = Stomp.over(socket);

        // কনসোলে সকেট লগ বন্ধ করতে চাইলে নিচের লাইনটি আনকমেন্ট করুন
        // this.stompClient.debug = () => {};

        this.stompClient.connect({}, (frame) => {
            console.log('✅ Connected to OnyxDrift Neural Link: ' + frame);
            this.connected = true;
            if (onConnectedCallback) onConnectedCallback();
        }, (error) => {
            console.error('❌ WebSocket Error:', error);
            this.connected = false;
            // ৫ সেকেন্ড পর আবার কানেক্ট করার চেষ্টা করবে
            setTimeout(() => this.connect(onConnectedCallback), 5000);
        });
    }

    // কোনো টপিকে সাবস্ক্রাইব করা (যেমন: নোটিফিকেশন বা মেসেজ)
    subscribe(topic, callback) {
        if (!this.connected || !this.stompClient) {
            console.warn("⚠️ WebSocket not connected. Retrying subscription in 2s...");
            setTimeout(() => this.subscribe(topic, callback), 2000);
            return;
        }

        const subscription = this.stompClient.subscribe(topic, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            }
        });

        console.log(`📡 Subscribed to: ${topic}`);
        return subscription;
    }

    // ডাটা পাঠানো
    send(destination, payload) {
        if (this.stompClient && this.connected) {
            this.stompClient.send(destination, {}, JSON.stringify(payload));
        } else {
            console.error("❌ Cannot send message. WebSocket not connected.");
        }
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.connected = false;
            console.log("🔌 Disconnected from WebSocket");
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;