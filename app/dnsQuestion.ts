export class DNSQuestion {
    name: Uint8Array;
    type: number;
    class: number;

    static parseDomainName(buffer: Buffer, offset: number): [Uint8Array, number] {
        const labels: number[] = [];
        let currentOffset = offset;
        
        while (true) {
            const length = buffer[currentOffset];
            
            // Check if this is a pointer (first two bits are 1)
            if ((length & 0xc0) === 0xc0) {
                // Extract pointer (14 bits)
                const pointer = ((length & 0x3f) << 8) | buffer[currentOffset + 1];
                
                // If this is a pointer, get remaining labels from the pointed location
                const [remainingLabels, _] = this.parseDomainName(buffer, pointer);
                labels.push(...remainingLabels);
                currentOffset += 2; // Move past the pointer (2 bytes)
                break;
            }
            
            // Regular label
            if (length === 0) {
                labels.push(0); // null terminator
                currentOffset++;
                break;
            }
            
            // Add length byte and label content
            labels.push(length);
            for (let i = 0; i < length; i++) {
                labels.push(buffer[currentOffset + 1 + i]);
            }
            currentOffset += length + 1;
        }
        
        return [new Uint8Array(labels), currentOffset];
    }

    static fromBuffer(buffer: Buffer, offset: number): [DNSQuestion, number] {
        const question = new DNSQuestion();
        
        // Parse domain name with compression support
        const [name, newOffset] = this.parseDomainName(buffer, offset);
        question.name = name;
        
        // Parse type and class
        question.type = (buffer[newOffset] << 8) | buffer[newOffset + 1];
        question.class = (buffer[newOffset + 2] << 8) | buffer[newOffset + 3];
        
        return [question, newOffset + 4];
    }

    encode(): Uint8Array {
        const bytes = new Uint8Array(this.name.length + 4);
        
        // Copy name including length bytes and null terminator
        bytes.set(this.name, 0);
        let offset = this.name.length;
        
        // Type (2 bytes)
        bytes[offset] = (this.type >> 8) & 0xff;
        bytes[offset + 1] = this.type & 0xff;
        
        // Class (2 bytes)
        bytes[offset + 2] = (this.class >> 8) & 0xff;
        bytes[offset + 3] = this.class & 0xff;
        
        return bytes;
    }
}