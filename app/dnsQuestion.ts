export class DNSQuestion {
    name: Uint8Array;
    type: number;
    class: number;

    static fromBuffer(buffer: Buffer, offset: number): [DNSQuestion, number] {
        const question = new DNSQuestion();
        const labels: number[] = [];
        let currentOffset = offset;

        // Parse domain name labels
        while (true) {
            const length = buffer[currentOffset];
            if (length === 0) {
                labels.push(0); // Add null terminator
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

        question.name = new Uint8Array(labels);
        
        // Parse type and class
        question.type = (buffer[currentOffset] << 8) | buffer[currentOffset + 1];
        question.class = (buffer[currentOffset + 2] << 8) | buffer[currentOffset + 3];
        currentOffset += 4;

        return [question, currentOffset];
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
