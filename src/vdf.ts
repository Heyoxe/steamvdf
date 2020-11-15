import { Readable } from "stream";
import { parseNumber, parseString, parseRawBytes } from "./helper";
import { VdfFileTypes, VdfVersions } from "./config";
import { VdfGameJson, VdfJson, VdfNodeData, VdfNodeJson } from "./types";

/** Vdf Supported types  */
const enum VdfTypes {
    None = 0,
    String,
    Int,
    Float,
    Ptr,
    Wstring,
    Color,
    Uint64,
    Numtypes,
    Int32 = Int,
    Float32 = Float,
    Map = None,
    End = Numtypes,
}

/** Vdf Node Helper */
class VdfNode {
    /** Node type */
    private _type!: VdfTypes;
    /** Node name */
    private _name!: string;
    /** Node value */
    private _value: VdfNodeData;

    /** File Stream */
    private _stream: Readable;
    /** How many sections the file has */
    private _childrenCount: number = 0;
    /** Array of sections */
    private _children: VdfNode[] = [];

    /** Returns the node type */
    get type(): VdfTypes { return this._type }
    /** Returns the node name */
    get name(): string { return this._name }
    /** Returns the node value */
    get value(): VdfNodeJson {
        if (this._type !== 0) {
            return this._value;
        } else {
            const object: any = {};
            this._children.forEach(child => {
                object[child.name] = child.value;
            });
            return object;
        }
    }
    /** How many children this entry has */
    get count(): number { return this._childrenCount }
    /** Array of children */
    get children(): VdfNode[] { return this._children }

    /**
     * @param stream A stream
     */
    constructor(stream: Readable) {
        this._stream = stream;
        this._parseType();
        if (this._type !== VdfTypes.End) {
            this._parseName();
            this._parseValue();
        }
    }

    /** Parses the node type */
    private _parseType(): void {
        this._type = parseNumber(this._stream, 8);
    }

    /** Parses the node name */
    private _parseName(): void {
        this._name = parseString(this._stream);
    }

    /** Parses the node value */
    private _parseValue(): void {
        switch (this._type) {
            case VdfTypes.Map: {
                this._childrenCount++;
                this._children.push(new VdfNode(this._stream));

                while (this._children[this._childrenCount - 1]._type !== VdfTypes.End) {
                    this._childrenCount++;
                    this._children.push(new VdfNode(this._stream));
                }

                this._childrenCount--;
                this._children.pop();
                break;
            }
            case VdfTypes.String: {
                this._value = parseString(this._stream);
                break;
            }
            case VdfTypes.Int32: {
                this._value = parseNumber(this._stream, 32);
                break;
            }
        }
    }
}

/** Vdf Game helper */
class VdfGame {
    // Headers
    /** App ID of the game */
    private _appId!: number;
    /** Binarized data size */
    private _dataSize!: number;
    /** State of the game */
    private _infoState!: number;
    /** When the game info was last updated */
    private _lastUpdated!: number;
    /** Access token (?) */
    private _accessToken!: number;
    /** Sha sign of the content (?) */
    private _sha!: string;
    /** Change number */
    private _changeNumber!: number;

    // Body
    /** How many sections the file has */
    private _childrenCount: number = 0;
    /** Array of sections */
    private _children: VdfNode[] = [];

    // "Internal" variables
    /** File Stream */
    private _stream: Readable;

    /** Steam AppID of the game */
    get appId(): number { return this._appId }
    /** Size of the chunk in the binary file starting after the dataSize value itself */
    get dataSize(): number { return this._dataSize }
    /** State of the game (?) */
    get infoState(): number { return this._infoState }
    /** When the game was last updated */
    get lastUpdated(): number { return this._lastUpdated }
    /** Access token (?) */
    get accessToken(): number { return this._accessToken }
    /** Sha (?) */
    get sha(): string { return this._sha }
    /** Build/Change number */
    get changeNumber(): number { return this._changeNumber }
    /** How many children this entry has */
    get count(): number { return this._childrenCount }
    /** Array of children */
    get children(): VdfNode[] { return this._children }

    /**
     * @param stream A stream
     */
    constructor(stream: Readable) {
        this._stream = stream;
        this._parseHeader();
        this._parseBody();
    }

    /**
     * Converts the content into a JSON format
     */
    public json(): VdfGameJson {
        const object: VdfGameJson = {
            appId: this._appId,
            dataSize: this._dataSize,
            infoState: this._infoState,
            lastUpdated: this._lastUpdated,
            // accessToken: this._accessToken,
            // sha: this._sha,
            changeNumber: this._changeNumber
        };
        this._children.forEach(child => {
            object[child.name] = child.value;
        });
        return object;
    }

    /**
     * Parse the game header
     */
    private _parseHeader(): void {
        this._appId = parseNumber(this._stream, 32);
        this._dataSize = parseNumber(this._stream, 32);
        this._infoState = parseNumber(this._stream, 32);
        this._lastUpdated = parseNumber(this._stream, 32);
        this._accessToken = parseNumber(this._stream, 64);
        this._sha = parseRawBytes(this._stream, 160);
        this._changeNumber = parseNumber(this._stream, 32);
    }

    /**
     * Parse the game content
     */
    private _parseBody(): void {
        this._childrenCount++;
        this._children.push(new VdfNode(this._stream));

        while (this._children[this._childrenCount - 1].type !== VdfTypes.End) {
            this._childrenCount++;
            this._children.push(new VdfNode(this._stream));
        }

        this._childrenCount--;
        this._children.pop();
    }
}

export class Vdf {
    // Headers
    /** What type of VDF types we can parse */
    private _vdfFileTypes = [VdfFileTypes.APPINFO];
    /** What VDF version can we parse */
    private _vdfVersions = VdfVersions;
    /** The "sign" of the file */
    private _sign!: number;
    /** The version of the file */
    private _version!: number;

    // Body
    /** How many games the file has */
    private _childrenCount: number = 0;
    /** Array of games */
    private _children: VdfGame[] = [];

    // "Internal" variables
    /** File Stream */
    private _stream: Readable;

    /** The "sign" of the file */
    get sign(): number { return this._sign }
    /** The version of the file */
    get version(): number { return this._version }
    /** How many children this entry has */
    get count(): number { return this._childrenCount }
    /** Array of children */
    get children(): VdfGame[] { return this._children }

    /**
     * @param buffer A buffer
     */
    constructor(buffer: Buffer) {
        this._stream = this._createStreamFromBuffer(buffer);
        this._parseHeader();
        this._parseBody();
    }

    /**
     * Converts the content into a JSON format
     */
    public jsonSync(): VdfJson {
        const object: VdfJson = {
            sign: this._sign,
            version: this._version,
            count: this._childrenCount,
            games: this._children.map(child => child.json())
        };
        return object;
    }

    public json(): Promise<VdfJson> {
        return new Promise((resolve) => {
            const object: VdfJson = {
                sign: this._sign,
                version: this._version,
                count: this._childrenCount,
                games: this._children.map(child => child.json())
            };
            resolve(object);
        });
    }

    /**
     * Parses the Binary VDF file headers
     */
    private _parseHeader(): void {
        this._sign = parseNumber(this._stream, 32);
        if (!this._vdfFileTypes.includes(this._sign)) {
            throw new Error(`Invalid VDF file type: ${this._sign}`);
        }
        this._version = parseNumber(this._stream, 32);
        if (!this._vdfVersions.includes(this._version)) {
            throw new Error("Invalid VDF version");
        }
    }

    /**
     * Parse the Binary VDF file content
     */
    private _parseBody(): void {
        try {
            while (true) {
                this._childrenCount++;
                this._children.push(new VdfGame(this._stream));
            }
        } catch (err) {
            this._childrenCount--;
            this._children.pop();
        }
    }

    /**
     * Creates a ReadableStream from a buffer
     * @param buffer Input buffer
     */
    private _createStreamFromBuffer(buffer: Buffer): Readable {
        return new Readable({
            read() {
                this.push(buffer);
                this.push(null)
            }
        });
    }
}
