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
        
        // Parse the question section (starts at byte 12)
        const [question, _] = DNSQuestion.fromBuffer(data, 12);
        
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
        responseHeader.questionCount = 1;
        responseHeader.answerRecordCount = 1;
        responseHeader.authorityRecordCount = 0;
        responseHeader.additionalRecordCount = 0;
        
        // Create answer using the parsed question name
        const answer = new DNSAnswer(question.name);
        
        // Combine all sections
        const response = Buffer.concat([
            Buffer.from(responseHeader.encode()),
            Buffer.from(question.encode()),
            Buffer.from(answer.encode())
        ]);
        
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});