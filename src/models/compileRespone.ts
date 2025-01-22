/**
 * Interface for compile response
 */
export interface CompileResponse {
    result: Result;
}

export interface Result {
    stdout: string;
    stderr: string;
    error: Error;
}

export interface Error {
    killed: boolean;
    code: number;
    signal: any;
    cmd: string;
}
