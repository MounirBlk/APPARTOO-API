import fs from "fs";
import multer from "multer";
//import net from "net";

/**
 *  INIT MULTER
 */
export const initUpload = (): any => {
    return {
        storage: multer.diskStorage({
            destination: (req, file, next) => {
                //specify destination
                if (!fs.existsSync(process.cwd() + "/temp/")) {
                    fs.mkdirSync(process.cwd() + "/temp/");
                }
                next(null, process.cwd() + "/temp/");
            },
            filename: (req, file, next) => {
                //specify the filename to be unique
                next(null, file.originalname);
            },
        }), limits: {
            fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
        },
    };
};
