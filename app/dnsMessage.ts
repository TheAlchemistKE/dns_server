export class DNSMessageHeader {
    packetID: number;
    isResponse: boolean;
    opCode: number;
    isAuthoritativeAnswer: boolean;
    isTruncated: boolean;
    isRecursionDesired: boolean;
    isRecursionAvailable: boolean;
    responseCode: number;
    questionCount: number;
    answerRecordCount: number;
    authorityRecordCount: number;
    additionalRecordCount: number;
    encode(): Uint8Array {
      const byteArray = new Uint8Array(12);
      // packetID
      let lowByte = this.packetID & 0xff;
      let highByte = (this.packetID >> 8) & 0xff;
      byteArray[0] = highByte;
      byteArray[1] = lowByte;
      // QR, OPCODE, AA, TC, RD
      let byte = 0;
      if (this.isResponse) byte |= 0b10000000;
      byte |= this.opCode << 3;
      if (this.isAuthoritativeAnswer) byte |= 0b00000100;
      if (this.isTruncated) byte |= 0b00000010;
      if (this.isRecursionDesired) byte |= 0b00000001;
      byteArray[2] = byte;
      // RA, Z, RCODE
      byte = 0;
      if (this.isRecursionAvailable) byte | 0b10000000;
      // Reserved always 0
      byte |= this.responseCode;
      byteArray[3] = byte;
      // QDCOUNT
      lowByte = this.questionCount & 0xff;
      highByte = (this.questionCount >> 8) & 0xff;
      byteArray[4] = highByte;
      byteArray[5] = lowByte;
      // ANCOUNT
      lowByte = this.answerRecordCount & 0xff;
      highByte = (this.answerRecordCount >> 8) & 0xff;
      byteArray[6] = highByte;
      byteArray[7] = lowByte;
      // NSCOUNT
      lowByte = this.authorityRecordCount & 0xff;
      highByte = (this.authorityRecordCount >> 8) & 0xff;
      byteArray[8] = highByte;
      byteArray[9] = lowByte;
      // ARCOUNT
      lowByte = this.additionalRecordCount & 0xff;
      highByte = (this.additionalRecordCount >> 8) & 0xff;
      byteArray[10] = highByte;
      byteArray[11] = lowByte;
      return byteArray;
    }
  }

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
