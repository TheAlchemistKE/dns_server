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

  static fromBuffer(buffer: Buffer): DNSMessageHeader {
      const header = new DNSMessageHeader();
      
      // Parse ID (first 2 bytes)
      header.packetID = (buffer[0] << 8) | buffer[1];
      
      // Parse flags (next 2 bytes)
      const flags = (buffer[2] << 8) | buffer[3];
      header.isResponse = (flags & 0x8000) !== 0;
      header.opCode = (flags >> 11) & 0x0F;
      header.isAuthoritativeAnswer = (flags & 0x0400) !== 0;
      header.isTruncated = (flags & 0x0200) !== 0;
      header.isRecursionDesired = (flags & 0x0100) !== 0;
      header.isRecursionAvailable = (flags & 0x0080) !== 0;
      header.responseCode = flags & 0x000F;
      
      // Parse counts (remaining 8 bytes)
      header.questionCount = (buffer[4] << 8) | buffer[5];
      header.answerRecordCount = (buffer[6] << 8) | buffer[7];
      header.authorityRecordCount = (buffer[8] << 8) | buffer[9];
      header.additionalRecordCount = (buffer[10] << 8) | buffer[11];
      
      return header;
  }

  encode(): Uint8Array {
      const byteArray = new Uint8Array(12);
      
      // packetID
      byteArray[0] = (this.packetID >> 8) & 0xff;
      byteArray[1] = this.packetID & 0xff;
      
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
      if (this.isRecursionAvailable) byte |= 0b10000000;
      // Z is always 0
      byte |= this.responseCode;
      byteArray[3] = byte;
      
      // QDCOUNT
      byteArray[4] = (this.questionCount >> 8) & 0xff;
      byteArray[5] = this.questionCount & 0xff;
      
      // ANCOUNT
      byteArray[6] = (this.answerRecordCount >> 8) & 0xff;
      byteArray[7] = this.answerRecordCount & 0xff;
      
      // NSCOUNT
      byteArray[8] = (this.authorityRecordCount >> 8) & 0xff;
      byteArray[9] = this.authorityRecordCount & 0xff;
      
      // ARCOUNT
      byteArray[10] = (this.additionalRecordCount >> 8) & 0xff;
      byteArray[11] = this.additionalRecordCount & 0xff;
      
      return byteArray;
  }
}