export class DNSAnswer {
    name: Uint8Array;
    type: number;
    class: number;
    ttl: number;
    rdlength: number;
    rdata: Uint8Array;

    constructor(questionName: Uint8Array) {
        this.name = questionName;  // Use the same name from question
        this.type = 1;  // A record
        this.class = 1; // IN class
        this.ttl = 60;  // 60 seconds TTL
        this.rdata = new Uint8Array([8, 8, 8, 8]); // IP address 8.8.8.8
        this.rdlength = 4; // Length of IPv4 address
    }

    encode(): Uint8Array {
        const bytes = new Uint8Array(this.name.length + 10 + this.rdlength);
        let offset = 0;

        // Copy name including length bytes and null terminator
        bytes.set(this.name, offset);
        offset += this.name.length;

        // Type (2 bytes)
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x01;
        offset += 2;

        // Class (2 bytes)
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x01;
        offset += 2;

        // TTL (4 bytes)
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x00;
        bytes[offset + 2] = 0x00;
        bytes[offset + 3] = this.ttl;
        offset += 4;

        // RDLENGTH (2 bytes)
        bytes[offset] = 0x00;
        bytes[offset + 1] = this.rdlength;
        offset += 2;

        // RDATA
        bytes.set(this.rdata, offset);

        return bytes;
    }
}