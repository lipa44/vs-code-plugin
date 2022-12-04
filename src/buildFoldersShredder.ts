import path = require("path");

export class BuildFoldersShredder {
    public tryDeleteBuildFolder(projectPath: string, folderName: string) {
        var fs = require('fs');

        try {
            fs.unlinkSync(path.join(projectPath, folderName));
        }
        catch (err) {
            return new SchredderResult(false, err as Error);
        }

        return new SchredderResult(true);
    }
}

export class SchredderResult {
    result: boolean;
    exception: Error | undefined;

    constructor(result: boolean, error: Error | undefined = undefined) {
        this.result = result;
        this.exception = error;
    }
}