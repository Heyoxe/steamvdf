import { Readable } from "stream";

/**
 * Parses a variable-length number
 * @param stream A stream
 * @param length Number size
 */
export function parseNumber(stream: Readable, length = 32): number {
    const bytes = length / 8;
    const buffer: Buffer = stream.read(bytes) ?? Buffer.from([0]);
    let number = buffer[0];
    for (let i = 1; i < bytes; i++) {
        number |= (buffer[i] << (i * 8));
    }
    return number;
}

/**
 * Parses a null-terminated string
 * @param stream A stream
 * */
export function parseString(stream: Readable): string {
    let string = "";
    while (true) {
        const code = (stream.read(1) as Buffer)[0];
        if (code == 0) {
            break;
        }
        string += String.fromCharCode(code);
    }
    return string;
}

/**
 * Returns the raw byte for a given size
 * @param stream A stream
 * @param length Chunk size
 * */
export function parseRawBytes(stream: Readable, length = 32): string {
    const bytes = length / 8;
    const buffer: Buffer = stream.read(bytes) ?? Buffer.from([0]);
    let string = "";
    for (let i = 0; i < bytes; i++) {
        string += buffer[i].toString(16);
    }
    return string;
}
