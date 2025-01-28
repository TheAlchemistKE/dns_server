import * as dgram from "dgram";
import { DNSMessageHeader, DNSQuestion } from "./dnsMessage";

const defaultHeader = new DNSMessageHeader();
defaultHeader.packetID = 1234;
defaultHeader.isResponse = true;
defaultHeader.questionCount = 1; // Set QDCOUNT to 1

const defaultQuestion = new DNSQuestion();

const udpSocket: dgram.Socket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        
        // Combine header and question sections
        const headerBytes = defaultHeader.encode();
        const questionBytes = defaultQuestion.encode();
        
        const response = Buffer.concat([
            Buffer.from(headerBytes),
            Buffer.from(questionBytes)
        ]);
        
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});