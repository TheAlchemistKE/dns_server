import * as dgram from "dgram";
import { DNSMessageHeader } from './dnsMessage';
import { DNSAnswer } from "./dnsAnswer";
import { DNSQuestion } from "./dnsQuestion";

const udpSocket: dgram.Socket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        
        // Parse the request header
        const requestHeader = DNSMessageHeader.fromBuffer(data);
        
        // Parse all questions
        let currentOffset = 12; // Start after header
        const questions: DNSQuestion[] = [];
        for (let i = 0; i < requestHeader.questionCount; i++) {
            const [question, newOffset] = DNSQuestion.fromBuffer(data, currentOffset);
            questions.push(question);
            currentOffset = newOffset;
        }
        
        // Create response header
        const responseHeader = new DNSMessageHeader();
        responseHeader.packetID = requestHeader.packetID;
        responseHeader.isResponse = true;
        responseHeader.opCode = requestHeader.opCode;
        responseHeader.isAuthoritativeAnswer = false;
        responseHeader.isTruncated = false;
        responseHeader.isRecursionDesired = requestHeader.isRecursionDesired;
        responseHeader.isRecursionAvailable = false;
        responseHeader.responseCode = requestHeader.opCode === 0 ? 0 : 4;
        responseHeader.questionCount = questions.length;
        responseHeader.answerRecordCount = questions.length;
        responseHeader.authorityRecordCount = 0;
        responseHeader.additionalRecordCount = 0;
        
        // Create answer sections
        const answers = questions.map(q => new DNSAnswer(q.name));
        
        // Combine all sections
        const response = Buffer.concat([
            Buffer.from(responseHeader.encode()),
            ...questions.map(q => Buffer.from(q.encode())),
            ...answers.map(a => Buffer.from(a.encode()))
        ]);
        
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});