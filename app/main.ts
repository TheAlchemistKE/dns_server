import * as dgram from "dgram";
import { DNSMessageHeader } from './dnsMessage';
import { DNSQuestion } from './dnsQuestion';
import { DNSAnswer } from './dnsAnswer';

class DNSForwarder {
    private serverSocket: dgram.Socket;
    private resolverAddress: string;
    private resolverPort: number;

    constructor(resolverAddr: string) {
        const [address, port] = resolverAddr.split(':');
        this.resolverAddress = address;
        this.resolverPort = parseInt(port);
        
        this.serverSocket = dgram.createSocket("udp4");
        this.setupServer();
    }

    private async forwardQuery(query: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const forwarderSocket = dgram.createSocket("udp4");
            
            const timeout = setTimeout(() => {
                forwarderSocket.close();
                reject(new Error('Resolver timeout'));
            }, 5000);

            forwarderSocket.on('error', (err) => {
                clearTimeout(timeout);
                forwarderSocket.close();
                reject(err);
            });

            forwarderSocket.on('message', (response: Buffer) => {
                clearTimeout(timeout);
                forwarderSocket.close();
                resolve(response);
            });

            forwarderSocket.send(query, this.resolverPort, this.resolverAddress);
        });
    }

    private setupServer() {
        this.serverSocket.on('message', async (clientQuery: Buffer, rinfo: dgram.RemoteInfo) => {
            try {
                // Parse original query
                const header = DNSMessageHeader.fromBuffer(clientQuery);
                const [questions, _] = this.parseQuestions(clientQuery, 12, header.questionCount);
                
                // Create response header first
                const responseHeader = new DNSMessageHeader();
                responseHeader.packetID = header.packetID;
                responseHeader.isResponse = true;
                responseHeader.opCode = header.opCode;
                responseHeader.isAuthoritativeAnswer = false;
                responseHeader.isTruncated = false;
                responseHeader.isRecursionDesired = header.isRecursionDesired;
                responseHeader.isRecursionAvailable = true;
                
                // Set RCODE based on OPCODE
                responseHeader.responseCode = header.opCode === 0 ? 0 : 4;

                // If OPCODE isn't 0, send response with RCODE 4 and no answers
                if (header.opCode !== 0) {
                    responseHeader.questionCount = questions.length;
                    responseHeader.answerRecordCount = 0;
                    responseHeader.authorityRecordCount = 0;
                    responseHeader.additionalRecordCount = 0;

                    const response = Buffer.concat([
                        Buffer.from(responseHeader.encode()),
                        ...questions.map(q => Buffer.from(q.encode()))
                    ]);

                    this.serverSocket.send(response, rinfo.port, rinfo.address);
                    return;
                }

                // For standard queries (OPCODE 0), proceed with forwarding
                const answers: DNSAnswer[] = [];

                // Forward each question separately
                for (const question of questions) {
                    // Create new query packet for single question
                    const singleHeader = new DNSMessageHeader();
                    singleHeader.packetID = header.packetID;
                    singleHeader.questionCount = 1;
                    singleHeader.isRecursionDesired = header.isRecursionDesired;

                    const queryPacket = Buffer.concat([
                        Buffer.from(singleHeader.encode()),
                        Buffer.from(question.encode())
                    ]);

                    try {
                        // Forward and wait for response
                        const response = await this.forwardQuery(queryPacket);
                        
                        // Parse response and extract answer
                        const [_, answerOffset] = DNSQuestion.fromBuffer(response, 12);
                        const [answer, __] = DNSAnswer.fromBuffer(response, answerOffset);
                        answers.push(answer);
                    } catch (error) {
                        console.error('Error forwarding query:', error);
                    }
                }

                // Update counts for response
                responseHeader.questionCount = questions.length;
                responseHeader.answerRecordCount = answers.length;
                responseHeader.authorityRecordCount = 0;
                responseHeader.additionalRecordCount = 0;

                // Combine all sections
                const response = Buffer.concat([
                    Buffer.from(responseHeader.encode()),
                    ...questions.map(q => Buffer.from(q.encode())),
                    ...answers.map(a => Buffer.from(a.encode()))
                ]);

                this.serverSocket.send(response, rinfo.port, rinfo.address);
            } catch (error) {
                console.error('Error processing query:', error);
            }
        });

        this.serverSocket.bind(2053, "127.0.0.1");
    }

    private parseQuestions(buffer: Buffer, offset: number, count: number): [DNSQuestion[], number] {
        const questions: DNSQuestion[] = [];
        let currentOffset = offset;

        for (let i = 0; i < count; i++) {
            const [question, newOffset] = DNSQuestion.fromBuffer(buffer, currentOffset);
            questions.push(question);
            currentOffset = newOffset;
        }

        return [questions, currentOffset];
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const resolverIndex = args.indexOf('--resolver');
if (resolverIndex === -1 || resolverIndex + 1 >= args.length) {
    console.error('Usage: ./your_server --resolver <address>');
    process.exit(1);
}

const resolverAddr = args[resolverIndex + 1];
new DNSForwarder(resolverAddr);