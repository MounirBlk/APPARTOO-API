import { Application, Request, Response, NextFunction, Errback } from 'express';
import PangolinInterface from '../interfaces/PangolinInterface';
import { boolFormat, dataResponse, deleteMapper, emailFormat, exist, firstLetterMaj, getJwtPayload, isDataOk, isEmptyNullUndefinedObject, isObjectIdValid, isValidLength, passwordFormat, payloadTokenInterface, textFormat } from '../middlewares';
import { mailRegister } from '../middlewares/sendMail';
import PangolinModel from '../models/PangolinModel';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CallbackError } from 'mongoose';

/**
 *  Route register pangolin
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    if (isEmptyNullUndefinedObject(data) || !exist(data.email) || !exist(data.password) || !exist(data.name) || !exist(data.civilite) || !exist(data.role)) {
        return dataResponse(res, 400, { error: true, message: 'Une ou plusieurs données obligatoire sont manquantes' })
    } else {
        if (!emailFormat(data.email) || !passwordFormat(data.password) || !textFormat(data.name) || !textFormat(data.civilite) || !textFormat(data.role) ||
            (data.civilite.toLowerCase() !== "homme" && data.civilite.toLowerCase() !== "femme" && data.civilite.toLowerCase() !== "nb") ||
            (data.role.toLowerCase() !== "guerrier" && data.role.toLowerCase() !== "alchimiste" && data.role.toLowerCase() !== "sorcier" && data.role.toLowerCase() !== "espions" && data.role.toLowerCase() !== "enchanteur")) {
            return dataResponse(res, 409, { error: true, message: "Une ou plusieurs données sont erronées" })
        } else {
            if (await PangolinModel.countDocuments({ email: data.email.trim().toLowerCase() }) !== 0) {// Email already exist
                return dataResponse(res, 409, { error: true, message: "Un pangolin utilisant cette adresse mail est déjà enregistré" });
            } else {
                let toInsert = {
                    email: data.email.trim().toLowerCase(),
                    password: data.password,
                    name: firstLetterMaj(data.name),
                    civilite: data.civilite.trim(),
                    role: data.role.trim()
                };
                const pangolinToSave: PangolinInterface = new PangolinModel(toInsert);
                pangolinToSave.save().then((pangolin: PangolinInterface) => {
                    if (isDataOk(pangolin)) {
                        return dataResponse(res, 201, { error: false, message: "Le pangolin a bien été créé avec succès" });
                    }
                }).catch(() => {
                    return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" });
                });
            }
        }
    }
}

/**
 *  Route login pangolin
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    if (isEmptyNullUndefinedObject(data) || !exist(data.email) || !exist(data.password)) {
        return dataResponse(res, 400, { error: true, message: 'Une ou plusieurs données obligatoire sont manquantes' })
    } else {
        if (!emailFormat(data.email) || !passwordFormat(data.password)) {
            return dataResponse(res, 409, { error: true, message: 'Email/password incorrect' })
        } else {
            const pangolin: PangolinInterface | null = await PangolinModel.findOne({ email: data.email.trim().toLowerCase() }); //verification email
            if (pangolin === null || pangolin === undefined) {
                return dataResponse(res, 409, { error: true, message: "Email/password incorrect" });
            } else {
                if (await pangolin.verifyPasswordSync(data.password)) {// Password correct
                    if (<number>pangolin.attempt >= 5 && ((<any>new Date() - <any>pangolin.updateAt) / 1000 / 60) <= 2) {
                        return dataResponse(res, 429, { error: true, message: "Trop de tentative sur l'email " + data.Email + " (5 max) - Veuillez patienter (2mins)" });
                    } else {
                        pangolin.token = jwt.sign({
                            id: pangolin.get("_id"),
                            role: pangolin.role,
                            exp: Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 7, // 7 jours
                        }, String(process.env.JWT_TOKEN_SECRET)/*, { expiresIn: '1d'}*/);
                        pangolin.attempt = 0;
                        pangolin.updateAt = new Date();
                        pangolin.lastLogin = new Date();
                        await pangolin.save();
                        return dataResponse(res, 200, { error: false, message: "Le pangolin a été authentifié avec succès", token: pangolin.token })
                    }
                } else {// Password incorrect
                    if (<number>pangolin.attempt >= 5 && ((<any>new Date() - <any>pangolin.updateAt) / 1000 / 60) <= 2) {
                        return dataResponse(res, 429, { error: true, message: "Trop de tentative sur l'email " + data.email + " (5 max) - Veuillez patienter (2mins)" });
                    } else if (<number>pangolin.attempt >= 5 && ((<any>new Date() - <any>pangolin.updateAt) / 1000 / 60) >= 2) {
                        pangolin.updateAt = new Date();
                        pangolin.attempt = 1;
                        await pangolin.save();
                        return dataResponse(res, 409, { error: true, message: 'Email/password incorrect' })
                    } else {
                        pangolin.updateAt = new Date();
                        pangolin.attempt = <number>pangolin.attempt + 1;
                        await pangolin.save();
                        return dataResponse(res, 409, { error: true, message: 'Email/password incorrect' })
                    }
                }
            }
        }
    }
}

/**
 *  Route delete pangolin
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const deletePangolin = async (req: Request, res: Response): Promise<void> => {
    getJwtPayload(req.headers.authorization).then(async (payload: payloadTokenInterface | null) => {
        if (payload === null || !isDataOk(payload)) {
            return dataResponse(res, 401, { error: true, message: 'Votre token n\'est pas correct' })
        } else {
            const id = req.params.id;
            if (!exist(id)) {
                return dataResponse(res, 400, { error: true, message: "L'id est manquant !" })
            } else {
                if (!isObjectIdValid(id) || await PangolinModel.countDocuments({ _id: id }) === 0) {
                    return dataResponse(res, 409, { error: true, message: "L'id n'est pas valide !" })
                } else {
                    await PangolinModel.findOne({ _id: id }, async (err: CallbackError, results: PangolinInterface) => {
                        if (err) {
                            return dataResponse(res, 500, {
                                error: true,
                                message: "Erreur dans la requête !"
                            });
                        } else if (results === undefined || results === null) {// Si le resultat n'existe pas
                            return dataResponse(res, 400, { error: true, message: "Aucun résultat pour la requête" });
                        } else {
                            if (results) {
                                await PangolinModel.findOneAndDelete({ _id: id });
                                return dataResponse(res, 200, { error: false, message: 'L\e pangolin a été supprimé avec succès' })
                            } else {
                                return dataResponse(res, 500, {
                                    error: true,
                                    message: "La requête en base de donnée n'a pas fonctionné"
                                });
                            }
                        }
                    });
                }
            }
        }
    }).catch((error) => {
        console.log(error)
        return dataResponse(res, 500, {
            error: true,
            message: "Erreur dans la requête !"
        });
    });
}

/**
 *  Route recuperation one pangolin infos
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const getOnePangolin = async (req: Request, res: Response): Promise<void> => {
    getJwtPayload(req.headers.authorization).then(async (payload: payloadTokenInterface | null) => {
        if (payload === null || !isDataOk(payload)) {
            return dataResponse(res, 401, { error: true, message: 'Votre token n\'est pas correct' })
        } else {
            const id: any = req.params.id;
            if (!isObjectIdValid(id) || await PangolinModel.countDocuments({ _id: id }) === 0) {
                return dataResponse(res, 409, { error: true, message: "L'id n'est pas valide !" })
            } else {
                PangolinModel.findOne({ _id: id }).populate({
                    path: 'ami',
                }).exec((err: CallbackError, results: PangolinInterface | null) => {
                    if (err) {
                        return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" });
                    } else if (results === undefined || results === null) {// Si le resultat n'existe pas
                        return dataResponse(res, 400, { error: true, message: "Aucun résultat pour la requête" });
                    } else {
                        if (results) {
                            results.ami = results.ami !== null && results.ami !== undefined ? deleteMapper(results.ami) : results.ami
                            return dataResponse(res, 200, {
                                error: false,
                                message: "Les informations ont bien été récupéré",
                                pangolin: deleteMapper(results),
                            });
                        } else {
                            return dataResponse(res, 401, {
                                error: true,
                                message: "La requête en base de donnée n'a pas fonctionné"
                            });
                        }
                    }
                });
            }
        }
    }).catch((error) => {
        console.log(error)
        return dataResponse(res, 500, {
            error: true,
            message: "Erreur dans la requête !"
        });
    });
}

/**
 *  Route recuperation des pangolins
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const getAllPangolins = async (req: Request, res: Response): Promise<void> => {
    getJwtPayload(req.headers.authorization).then(async (payload: payloadTokenInterface | null) => {
        if (payload === null || !isDataOk(payload)) {
            return dataResponse(res, 401, { error: true, message: 'Votre token n\'est pas correct' })
        } else {
            PangolinModel.find({}).populate({
                path: 'ami',
            }).exec((err: CallbackError, results: PangolinInterface[]) => {
                if (err) {
                    return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" });
                } else if (results === undefined || results === null) {// Si le resultat n'existe pas
                    return dataResponse(res, 400, { error: true, message: "Aucun résultat pour la requête" });
                } else {
                    if (results) {
                        results.forEach((el: PangolinInterface) => {
                            el.ami = el.ami !== null && el.ami !== undefined ? deleteMapper(el.ami) : el.ami
                        });
                        return dataResponse(res, 200, {
                            error: false,
                            message: "Les pangolins ont bien été récupéré",
                            pangolins: results.map((item: PangolinInterface) => deleteMapper(item))
                        });
                    } else {
                        return dataResponse(res, 500, {
                            error: true,
                            message: "La requête en base de donnée n'a pas fonctionné"
                        });
                    }
                }
            });

        }
    }).catch((error) => {
        console.log(error)
        return dataResponse(res, 500, {
            error: true,
            message: "Erreur dans la requête !"
        });
    });
}

/**
 *  Route recuperation pangolin connecte
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const getOwnPangolin = async (req: Request, res: Response): Promise<void> => {
    getJwtPayload(req.headers.authorization).then(async (payload: payloadTokenInterface | null) => {
        if (payload === null || !isDataOk(payload)) {
            return dataResponse(res, 401, { error: true, message: 'Votre token n\'est pas correct' })
        } else {
            PangolinModel.findOne({ _id: payload.id }).populate({
                path: 'ami',
            }).exec((err: CallbackError, results: PangolinInterface | null) => {
                if (err) {
                    return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" });
                } else if (results === undefined || results === null) {// Si le resultat n'existe pas
                    return dataResponse(res, 400, { error: true, message: "Aucun résultat pour la requête" });
                } else {
                    if (results) {
                        results.ami = results.ami !== null && results.ami !== undefined ? deleteMapper(results.ami) : results.ami
                        return dataResponse(res, 200, {
                            error: false,
                            message: "Les informations ont bien été récupéré",
                            pangolin: deleteMapper(results),
                        });
                    } else {
                        return dataResponse(res, 401, {
                            error: true,
                            message: "La requête en base de donnée n'a pas fonctionné"
                        });
                    }
                }
            });
        }
    }).catch((error) => {
        console.log(error)
        return dataResponse(res, 500, {
            error: true,
            message: "Erreur dans la requête !"
        });
    });
}


/**
 *  Route update pangolin
 *  @param {Request} req 
 *  @param {Response} res 
 */
export const updatePangolin = async (req: Request, res: Response): Promise<void> => {
    getJwtPayload(req.headers.authorization).then(async (payload: payloadTokenInterface | null) => {
        if (payload === null || !isDataOk(payload)) {
            return dataResponse(res, 401, { error: true, message: 'Votre token n\'est pas correct' })
        } else {
            const data = req.body;
            const id = req.params.id;
            if (!exist(id)) {
                return dataResponse(res, 400, { error: true, message: "L'id est manquant !" })
            } else {
                if (!isObjectIdValid(id) || await PangolinModel.countDocuments({ _id: id }) === 0) {
                    return dataResponse(res, 409, { error: true, message: "L'id n'est pas valide !" })
                } else {
                    if (isEmptyNullUndefinedObject(data)) {
                        return dataResponse(res, 200, { error: false, message: "Vos données sont déjà à jour" })
                    } else {
                        const pangolin: PangolinInterface | null = await PangolinModel.findById(id);
                        if (pangolin === null || pangolin === undefined) {
                            return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" })
                        } else {
                            let isOnError: boolean = false;
                            isOnError = exist(data.portable) ? isValidLength(data.portable, 1, 30) ? false : true : false;
                            let ami = null;
                            if (exist(data.ami)) {
                                ami = isObjectIdValid(data.ami) && await PangolinModel.countDocuments({ _id: data.ami }) !== 0 ? data.ami : pangolin.ami
                            }
                            let toUpdate: any = {
                                name: exist(data.name) ? !textFormat(data.name) ? (isOnError = true) : firstLetterMaj(data.name) : pangolin.name,
                                civilite: exist(data.civilite) ? (data.civilite.toLowerCase() !== "homme" && data.civilite.toLowerCase() !== "femme" && data.civilite.toLowerCase() !== "nb") ? (isOnError = true) : data.civilite : pangolin.civilite,
                                role: exist(data.role) ? !textFormat(data.role) ? (isOnError = true) : data.role : pangolin.role,
                                ami: ami,
                            }
                            if (isOnError) {
                                return dataResponse(res, 409, { error: true, message: "Une ou plusieurs données sont erronées" })
                            } else {
                                await PangolinModel.findByIdAndUpdate(id, toUpdate, null, (err: CallbackError, resp: any) => {
                                    if (err) {
                                        return dataResponse(res, 500, { error: true, message: "Erreur dans la requête !" })
                                    } else {
                                        return dataResponse(res, 200, { error: false, message: "Le pangolin a bien été mis à jour", pangolin: deleteMapper(resp) })
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }).catch((error) => {
        console.log(error)
        return dataResponse(res, 500, {
            error: true,
            message: "Erreur dans la requête !"
        });
    });
}