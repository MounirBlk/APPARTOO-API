import { Application, Request, Response, NextFunction, Errback } from 'express';
import PangolinModel from '../models/PangolinModel';
import jwt from 'jsonwebtoken';
import { isValidObjectId, Types } from 'mongoose'
import v from 'validator';
import fs from 'fs'
import { allTypes, roleTypes } from '../type';
import { errorLogger } from '../config/winston';

const fsp = fs.promises;

/**
 * Function qui fait un retour d'une donnée
 * @param {Response} res 
 * @param {Number} status 
 * @param {Object} data 
 */
const dataResponse = (res: Response, status: number = 500, data: any = { error: true, message: "Processing error" }) => {
    res.setHeader("Content-Type", "application/json");
    if (!isEmptyNullUndefinedObject(data)) {
        if (data.hasOwnProperty('error')) {
            if (data.error) {
                errorLogger.error(`${status || 500} - ${isDataOk(data.message) && typeof data.message === 'string' ? data.message : 'Processing error'}`);
            }
        }
    }
    try {
        res.status(status).json(data);
    } catch (error: any) {
        //Cette erreur ne DOIT jamais apparaitre
        errorLogger.error(`${error.status || 500} - ${isDataOk(error.message) && typeof error.message === 'string' ? error.message : 'Processing error'}`);
        let sendError = { error: true, message: isDataOk(error.message) && typeof error.message === 'string' ? error.message : 'Processing error' };
        res.status(500).json(sendError);
    }
}

/**
 *  Function qui supprime les données return inutile
 *  @param {Object} data Data
 */
const deleteMapper = (data: any): any => {
    data.token = undefined;
    data.attempt = undefined;
    data.password = undefined;
    data.updatedAt = undefined;
    data.__v = undefined;
    data.active = undefined;
    return data;
}

/**
 *  Function qui vérifie l'existence d'une data
 */
const exist = (data: any): Boolean => {
    if (!isDataOk(data) || (typeof data === 'string' ? data.trim().length == 0 || data === '' || v.isEmpty(data) : false))
        return false
    else
        return true
}

/**
 *  Function qui vérifie l'existence d'une data type array tableau
 */
const existTab = (data: Array<any>): Boolean => {
    if (!isDataOk(data))
        return false
    else
        return true
}

/**
 *  Function qui vérifie si l'objet est vide ou null ou undefined
 */
const isEmptyNullUndefinedObject = (objectData: any): boolean => {
    if (isUndefinedOrNull(objectData)) return true;
    if (typeof objectData === "object" && !Array.isArray(objectData) && Object.keys(objectData).length !== 0) {
        for (let key in objectData) {
            if (Object.prototype.hasOwnProperty.call(objectData, key)) {
                return false;
            }
        }
    }
    return true;
}


/**
 *  Function vérification de si l'email est dans le bon format
 */
const emailFormat = (data: string): Boolean => {
    if (typeof data !== 'string') return false
    //let regexEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    let regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!isDataOk(data) || data.match(regexEmail) == null)
        return false
    else
        return true
}

/**
 *  Function vérification password (taille entre 7 et 20 caracteres)
 */
const passwordFormat = (data: string): Boolean => {
    if (typeof data !== 'string') return false
    //let regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{7,})/; //maj mini chiffre taille7
    //let regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; //maj mini specialchar chiffre taille8 mini
    let regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^-])[A-Za-z\d@$!%*?&#^-]{7,20}$/; //maj mini specialchar chiffre taille7_mini taille20_max
    return (data.match(regexPassword) == null || !isDataOk(data) /*|| !isValidLength(data, 7, 20)*/) ? false : true
}

/**
 *  Function vérification de si le text est dans le bon format (taille entre 2 et 25 caracteres)
 */
const textFormat = (data: string): Boolean => {
    let regexText = /^[^@"()/!_$*€£`+=;?#]+$/ // regex:  /^[^@&"()!_$*€£`+=\/;?#]+$/   (ajouter les chars spéc a ne pas ajouter au texte)
    if (typeof data !== 'string') return false
    if (!isDataOk(data) || data.match(regexText) == null)
        return false
    else
        return isValidLength(data, 1, 100) ? true : false

}

/**
 *  Function vérification de si la data est dans le bon format boolean
 */
const boolFormat = (data: any): Boolean => {
    if (isDataOk(data) && (typeof data === 'boolean' || (typeof data === 'string' ? v.isBoolean(data) || data === 'true' || data === 'false' : false))) {
        return true
    } else {
        return false
    }
}

const containSpecialsChar = (data: any) => isDataOk(data) && /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(data);

/**
 *  Function qui vérifie la conformité d'un tableau de chaine de caracteres (Array<string>)
 *  @param {any} data
 */
const tabFormat = (data: any): Boolean => {
    if (!isDataOk(data) || !Array.isArray(data) || isUndefinedOrNull(data))
        return false
    else
        return true
}

/**
 *  Function vérification de si la data est dans le format number
 */
const numberFormat = (data: string | number): Boolean => {
    let regexNumber = /^[0-9]+$/
    if (typeof data === 'string') {
        if (!isDataOk(data) || data.match(regexNumber) == null || !v.isNumeric(data)) return false
    }
    if (typeof data === 'number') {
        if (!isDataOk(data) || isNaN(data) || Number.isNaN(data)) return false
    }
    return true
}


/**
 *  Function vérification si le mdp possede 6 caracteres min
 */
const isValidPasswordLength = (password: string): boolean => {
    if (typeof password !== 'string') return false
    return isDataOk(password) && password.length >= 6 ? true : false;
}


/**
 *  Function vérification de la taille min et max d'une variable
 */
const isValidLength = (text: string, min: number, max: number, isNullable: boolean = false): boolean => {
    if (typeof text !== 'string') return false
    return (!isNullable ? isDataOk(text) : true) && text.length >= min && text.length <= max ? true : false;
}


/**
 *  Function qui return la date du jour à la seconde près aaaa/mm/jj hh:mm
 */
const getCurrentDate = (dt: Date = new Date()) => {
    return `${dt.getFullYear().toString().padStart(4, '0')}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
}

/**
 *  Function qui return la date du jour à la seconde près aaaa/mm/jj hh:mm:ss
 */
const getCurrentDateWithSeconds = (dt: Date = new Date()) => {
    //:${dt.getSeconds().toString().padStart(2, '0')}
    return `${dt.getFullYear().toString().padStart(4, '0')}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`
}

/**
 *  Function qui return la date du jour aaaa/mm/jj
 */
const getCurrentDateDay = (dt: Date = new Date()) => {
    //:${dt.getSeconds().toString().padStart(2, '0')}
    return `${dt.getFullYear().toString().padStart(4, '0')}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`
}

/**
 *  Function qui return time en hh:mm:ss
 */
const getTimeHourSecMin = (dt: Date = new Date()) => {
    return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`
}


/**
 *  Function 1er lettre maj
 */
const firstLetterMaj = (texte: string): any => {
    return texte.trim().charAt(0).toUpperCase() + texte.trim().substring(1).toLowerCase();
};



/**
 *  Function qui test le token et recupere le payload du token
 *  @param {string} token (with Bearer)
 */
const getJwtPayload = async (tokenHeader: string | undefined): Promise<any | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (tokenHeader && tokenHeader !== undefined && isDataOk(tokenHeader)) {
                const token = tokenHeader.replace(/^bearer/i, "").trim();
                if (!v.isJWT(token) || await PangolinModel.countDocuments({ token: token }) === 0) { // Un utilisateur connecté par compte
                    resolve(null);// TODO: to perform with reject()
                } else {
                    const jwtObject = jwt.verify(token, String(process.env.JWT_TOKEN_SECRET));
                    if (isDataOk(jwtObject)) {
                        resolve(jwtObject);
                    } else {
                        resolve(null);// TODO: to perform with reject()
                    }
                }
            } else {
                resolve(null);// TODO: to perform with reject()
            }
            return null;
        } catch (err) {
            //console.log(err)
            resolve(null);// TODO: to perform with reject()
        }
    });
}

//INTERFACE payload token
export interface payloadTokenInterface {
    id: string,
    role: roleTypes
}


/**
 *  Validité de l'object ID
 */
const isObjectIdValid = (id: string): boolean => {
    if (typeof id !== 'string') return false
    return isDataOk(id) && (typeof id === "string" ? v.isMongoId(id) : false) && isValidObjectId(id) && isValidLength(id, 24, 24) && textFormat(id) ? true : false
}

/**
 *  Validité du tableau d'object ID
 */
const isTabObjectIdValid = (tabID: string[]): boolean => {
    let isSuccess: boolean = true;
    if (isDataOk(tabID) && Array.isArray(tabID)) {
        tabID.forEach((el: string) => {
            if (!isObjectIdValid(el)) isSuccess = false
        });
    } else {
        isSuccess = false
    }
    return isSuccess;
}

/**@param {any} data vérifie si la donnée existe et n'est pas à null*/
const isDataOk = (data: any, isLog: boolean = false): boolean => {
    if (isLog) console.log(`[LOG] - [${getCurrentDateWithSeconds()}] | [type] => [${typeof data}] | [data] => [${data}]`)
    return data !== undefined && data !== null &&
        (typeof data === 'string' ? data !== 'null' && data !== 'undefined' : true) &&
        (typeof data === 'object' && !Array.isArray(data) ? !isEmptyNullUndefinedObject(data) : true);
}

const cleanFolder = (path: string) => {
    fs.readdirSync(path).forEach((el: string) => {
        if (fs.lstatSync(path).isFile()) {
            fs.unlinkSync(path + el)
        } else {
            fs.rmdirSync(path + el, { recursive: true })
        }
    });
}

const cleanOneFileFolder = (path: string) => {
    if (fs.existsSync(path)) {
        if (fs.lstatSync(path).isFile()) {
            fs.unlinkSync(path)
        } else {
            fs.rmdirSync(path, { recursive: true })
        }
    }
}

/**@param {number} ms Attente dans la requete*/
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isDataFindOk = (dataTab: string[], dataFind: string, isNullable: boolean = false): boolean => {
    if (isNullable) {
        if (dataFind === null || dataFind === 'null' || dataFind === 'Null') {
            return true
        }
    }
    const regex: RegExp = /^[^@"()/!_$*€£`+=;?#]+$/;
    if (!isDataOk(dataFind) || dataFind.match(regex) == null)
        return false
    else
        return isDataOk(dataTab.includes(dataFind))
    //return isDataOk(dataTab.find((el: string) => el === dataFind))
}

const getDataReq = (req: Request) => {
    return {
        data: req.body,
        types: allTypes()
    }
}

const isJsonObjectNotEmpty = (str: string, isCheckEmptyObject: boolean = false): boolean => {
    const isRegexObject: boolean = /^[\],:{}\s]*$/.test(str.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
    return isDataOk(str) && typeof str === 'string' && JSON.parse(str) && isDataOk(JSON.parse(str)) && (isCheckEmptyObject ? !isEmptyNullUndefinedObject(JSON.parse(str)) : true) && typeof JSON.parse(str) === 'object' && isRegexObject
}


const castTypeNumber = (data: any) => parseInt(String(data))

const isUndefinedOrNull = (data: any) => data === undefined || data === null;

/**
 *  Function qui créer un dossier
 */
const verifAndCreateFolder = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

/**
 *  Function qui supprime un dossier RECURSIVE ou fichier
 */
const verifAndDeleteFolderFile = (path: string) => {
    if (fs.existsSync(path)) {
        if (fs.lstatSync(path).isFile()) {
            fs.unlinkSync(path);
        } else {
            fs.rmdirSync(path, { recursive: true });
        }
    }
}


export { fsp, dataResponse, verifAndDeleteFolderFile, verifAndCreateFolder, containSpecialsChar, getCurrentDateWithSeconds, isDataFindOk, castTypeNumber, isUndefinedOrNull, getCurrentDateDay, isJsonObjectNotEmpty, isTabObjectIdValid, getDataReq, sleep, cleanFolder, cleanOneFileFolder, boolFormat, isDataOk, isObjectIdValid, existTab, tabFormat, firstLetterMaj, isEmptyNullUndefinedObject, getJwtPayload,  getCurrentDate, getTimeHourSecMin, isValidLength, isValidPasswordLength, deleteMapper, exist, emailFormat, passwordFormat, textFormat, numberFormat };