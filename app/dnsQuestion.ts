export class DNSQuestion {
    encodedName: Uint8Array;
    type: number;
    class: number;

    constructor() {
        // Encode "codecrafters.io" as specified: \x0ccodecrafters\x02io\x00
        this.encodedName = new Uint8Array([
            0x0c, ...Array.from("codecrafters").map(c => c.charCodeAt(0)),
            0x02, ...Array.from("io").map(c => c.charCodeAt(0)),
            0x00
        ]);
        this.type = 1;  // A record
        this.class = 1; // IN class
    }

    encode(): Uint8Array {
        const bytes = new Uint8Array(this.encodedName.length + 4); // name + 2 bytes type + 2 bytes class
        
        // Copy the encoded name
        bytes.set(this.encodedName, 0);
        let offset = this.encodedName.length;

        // Type (2 bytes, big-endian)
        bytes[offset] = 0x00;
        bytes[offset + 1] = 0x01;

        // Class (2 bytes, big-endian)
        bytes[offset + 2] = 0x00;
        bytes[offset + 3] = 0x01;

        return bytes;
    }
}