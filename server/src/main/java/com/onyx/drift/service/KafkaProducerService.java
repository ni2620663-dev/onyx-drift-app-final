package com.onyx.drift.service;

import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    // Kafka নেই, তাই আমরা শুধু কনসোলে প্রিন্ট করবো
    public void sendMessage(String topic, String message) {
        System.out.println("LOG: Message to topic [" + topic + "]: " + message);
    }
}