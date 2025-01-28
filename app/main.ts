import * as dgram from "dgram";
import { DNSMessageHeader } from './dnsMessage';
import { DNSQuestion } from './dnsQuestion';
import { DNSAnswer } from './dnsAnswer';

class DNSForwarder {
    private resolverAddress: string;
    private resolverPort: number;
    private forwarderSocket: dgram.Socket;
    private serverSocket: dgram.Socket;

    constructor(resolverAddr: string) {
        const [address, port] = resolverAddr.split(':');
        this.resolverAddress = address;
        this.resolverPort = parseInt(port);
        
        // Socket for receiving client queries
        this.serverSocket = dgram.createSocket("udp4");
        // Socket for forwarding queries to resolver
        this.forwarderSocket = dgram.createSocket("udp4");

        this.setupForwarderSocket();
        this.setupServerSocket();
    }

    private setupForwarderSocket() {
        // Map to store client info for each query ID
        const pendingQueries = new Map<number, {
            clientAddress: string;
            clientPort: number;
            remainingQueries: number;
            originalHeader: DNSMessageHeader;
            answers: DNSAnswer[];
        }>();

        this.forwarderSocket.on('message', (response: Buffer, _: dgram.RemoteInfo) => {
            try {
                // Parse response from resolver
                const responseHeader = DNSMessageHeader.fromBuffer(response);
                const [question, answerOffset] = DNSQuestion.fromBuffer(response, 12);
                const answer = DNSAnswer.fromBuffer(response, answerOffset);

                // Get original client info
                const queryInfo = pendingQueries.get(responseHeader.packetID);
                if (!queryInfo) return;

                // Add this answer to the collection
                queryInfo.answers.push(answer);
                queryInfo.remainingQueries--;

                // If we've received all answers, send combined response to client
                if (queryInfo.remainingQueries === 0) {
                    const finalHeader = queryInfo.originalHeader;
                    finalHeader.answerRecordCount = queryInfo.answers.length;

                    const [questions, _] = this.parseQuestions(response, 12, finalHeader.questionCount);
                    
                    // Combine all sections
                    const finalResponse = Buffer.concat([
                        Buffer.from(finalHeader.encode()),
                        ...questions.map(q => Buffer.from(q.encode())),
                        ...queryInfo.answers.map(a => Buffer.from(a.encode()))
                    ]);

                    this.serverSocket.send(
                        finalResponse,
                        queryInfo.clientPort,
                        queryInfo.clientAddress
                    );

                    pendingQueries.delete(responseHeader.packetID);
                }
            } catch (error) {
                console.error('Error processing resolver response:', error);
            }
        });
    }

    private setupServerSocket() {
        this.serverSocket.on('message', async (query: Buffer, rinfo: dgram.RemoteInfo) => {
            try {
                const header = DNSMessageHeader.fromBuffer(query);
                const [questions, _] = this.parseQuestions(query, 12, header.questionCount);

                // Store client info for response handling
                const queryInfo = {
                    clientAddress: rinfo.address,
                    clientPort: rinfo.port,
                    remainingQueries: questions.length,
                    originalHeader: header,
                    answers: [] as DNSAnswer[]
                };

                // Forward each question separately
                for (let i = 0; i < questions.length; i++) {
                    const singleQuestionHeader = new DNSMessageHeader();
                    singleQuestionHeader.packetID = header.packetID;
                    singleQuestionHeader.questionCount = 1;
                    singleQuestionHeader.isRecursionDesired = header.isRecursionDesired;

                    const forwardQuery = Buffer.concat([
                        Buffer.from(singleQuestionHeader.encode()),
                        Buffer.from(questions[i].encode())
                    ]);

                    this.forwarderSocket.send(
                        forwardQuery,
                        this.resolverPort,
                        this.resolverAddress
                    );
                }

                // Store query info for handling responses
                this.pendingQueries.set(header.packetID, queryInfo);
            } catch (error) {
                console.error('Error processing client query:', error);
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

    private pendingQueries = new Map<number, {
        clientAddress: string;
        clientPort: number;
        remainingQueries: number;
        originalHeader: DNSMessageHeader;
        answers: DNSAnswer[];
    }>();
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