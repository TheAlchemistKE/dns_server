import { DNSQuestion } from "./dnsQuestion";

export class DNSAnswer {
    name: Uint8Array;
    type: number;
    class: number;
    ttl: number;
    rdlength: number;
    rdata: Uint8Array;

    static fromBuffer(buffer: Buffer, offset: number): [DNSAnswer, number] {
        const answer = new DNSAnswer();
        
        // Parse domain name
        const [name, newOffset] = DNSQuestion.parseDomainName(buffer, offset);
        answer.name = name;
        let currentOffset = newOffset;
        
        // Parse type and class
        answer.type = (buffer[currentOffset] << 8) | buffer[currentOffset + 1];
        answer.class = (buffer[currentOffset + 2] << 8) | buffer[currentOffset + 3];
        currentOffset += 4;
        
        // Parse TTL (4 bytes)
        answer.ttl = (buffer[currentOffset] << 24) |
                    (buffer[currentOffset + 1] << 16) |
                    (buffer[currentOffset + 2] << 8) |
                    buffer[currentOffset + 3];
        currentOffset += 4;
        
        // Parse RDLENGTH
        answer.rdlength = (buffer[currentOffset] << 8) | buffer[currentOffset + 1];
        currentOffset += 2;
        
        // Parse RDATA
        answer.rdata = new Uint8Array(answer.rdlength);
        for (let i = 0; i < answer.rdlength; i++) {
            answer.rdata[i] = buffer[currentOffset + i];
        }
        currentOffset += answer.rdlength;
        
        return [answer, currentOffset];
    }

    encode(): Uint8Array {
        const bytes = new Uint8Array(this.name.length + 10 + this.rdlength);
        let offset = 0;

        // Copy name
        bytes.set(this.name, offset);
        offset += this.name.length;

        // Type (2 bytes)
        bytes[offset] = (this.type >> 8) & 0xff;
        bytes[offset + 1] = this.type & 0xff;
        offset += 2;

        // Class (2 bytes)
        bytes[offset] = (this.class >> 8) & 0xff;
        bytes[offset + 1] = this.class & 0xff;
        offset += 2;

        // TTL (4 bytes)
        bytes[offset] = (this.ttl >> 24) & 0xff;
        bytes[offset + 1] = (this.ttl >> 16) & 0xff;
        bytes[offset + 2] = (this.ttl >> 8) & 0xff;
        bytes[offset + 3] = this.ttl & 0xff;
        offset += 4;

        // RDLENGTH (2 bytes)
        bytes[offset] = (this.rdlength >> 8) & 0xff;
        bytes[offset + 1] = this.rdlength & 0xff;
        offset += 2;

        // RDATA
        bytes.set(this.rdata, offset);

        return bytes;
    }
}