import * as dgram from "dgram";
import { DNSMessageHeader } from './dnsMessage';


// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const defaultHeader = new DNSMessageHeader();
defaultHeader.packetID = 1234;
defaultHeader.isResponse = true;

const udpSocket: dgram.Socket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        const response = Buffer.from(defaultHeader.encode());
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});
