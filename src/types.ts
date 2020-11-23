/** Node data */
export type VdfNodeData = undefined | string | number | any;

/** Node JSON */
export type VdfNodeJson = {
    [key: string]: VdfNodeJson;
} | VdfNodeData;

/** Game JSON */
export type VdfGameJson = {
    /** AppID of the game */
    appId: number;
    // dataSize: number;
    /** Info state */
    infoState: number;
    /** When it was last updated */
    lastUpdated: number;
    // accessToken: number;
    // sha: number;
    [key: string]: VdfNodeJson;
};

/** Vdf File JSON */
export type VdfJson = {
    /** Sign of the VDF File, always 123094055 for appinfo.vdf */
    sign: number;
    /** Version of the VDF File */
    version: number;
    /** How many sections (games) the VDF file has */
    count: number;
    /** Array of section (games) */
    games: VdfGameJson[];
};
