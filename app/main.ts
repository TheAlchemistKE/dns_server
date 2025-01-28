import * as dgram from "dgram";
import { DNSMessageHeader } from './dnsMessage';
import { DNSQuestion } from './dnsQuestion';
import { DNSAnswer } from "./dnsAnswer";

const defaultHeader = new DNSMessageHeader();
defaultHeader.packetID = 1234;
defaultHeader.isResponse = true;
defaultHeader.questionCount = 1;
defaultHeader.answerRecordCount = 1; // Set ANCOUNT to 1

const defaultQuestion = new DNSQuestion();
const defaultAnswer = new DNSAnswer();

const udpSocket: dgram.Socket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        
        // Combine header, question, and answer sections
        const headerBytes = defaultHeader.encode();
        const questionBytes = defaultQuestion.encode();
        const answerBytes = defaultAnswer.encode();
        
        const response = Buffer.concat([
            Buffer.from(headerBytes),
            Buffer.from(questionBytes),
            Buffer.from(answerBytes)
        ]);
        
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});