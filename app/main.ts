import * as dgram from "dgram";
import { DNSQuestion } from './dnsQuestion';
import { DNSAnswer } from './dnsAnswer';
import { DNSMessageHeader } from "./dnsMessage";

const udpSocket: dgram.Socket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        
        // Parse the request header
        const requestHeader = DNSMessageHeader.fromBuffer(data);
        
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
        
        // Create question and answer sections
        const question = new DNSQuestion();
        const answer = new DNSAnswer();
        
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