import path = require("path");

export class BuildFoldersShredder {
    public tryDeleteBuildFolder = (projectPath: string, folderName: string) => {
        const fs = require('fs');

        try {
            fs.rmSync(path.join(projectPath, folderName), { recursive: true, force: true });
        }
        catch (err) {
            return new ShredderResult(false, err as Error);
        }

        return new ShredderResult(true);
    };
}

export class ShredderResult {
    result: boolean;
    exception: Error | undefined;

    constructor(result: boolean, error: Error | undefined = undefined) {
        this.result = result;
        this.exception = error;
    }
}