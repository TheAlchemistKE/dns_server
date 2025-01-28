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
    name: string;
    type: number;
    class: number;

    constructor(name: string = "codecrafters.io", type: number = 1, qclass: number = 1) {
        this.name = name;
        this.type = type;
        this.class = qclass;
    }

    encode(): Uint8Array {
        // Convert domain name to labels
        const labels = this.name.split('.');
        let nameLength = labels.reduce((acc, label) => acc + label.length + 1, 1); // +1 for length byte, +1 for null terminator
        
        const bytes = new Uint8Array(nameLength + 4); // +4 for type and class
        let offset = 0;

        // Encode name as sequence of labels
        for (const label of labels) {
            bytes[offset] = label.length;
            offset++;
            for (let i = 0; i < label.length; i++) {
                bytes[offset + i] = label.charCodeAt(i);
            }
            offset += label.length;
        }
        bytes[offset] = 0; // null terminator
        offset++;

        // Encode type (2 bytes)
        bytes[offset] = (this.type >> 8) & 0xff;
        bytes[offset + 1] = this.type & 0xff;

        // Encode class (2 bytes)
        bytes[offset + 2] = (this.class >> 8) & 0xff;
        bytes[offset + 3] = this.class & 0xff;

        return bytes;
    }
}