import { Application, Request, Response, NextFunction, Errback } from "express";
import { register, login, deletePangolin, getOnePangolin, getOwnPangolin, getAllPangolins, updatePangolin } from "../controllers/pangolin";

export const routes = (app: Application): void => {
    app.route('/pangolin/register').post(register);
    app.route('/pangolin/login').post(login);
    app.route('/pangolin/delete/:id').delete(deletePangolin);
    app.route('/pangolin/one/:id').get(getOnePangolin);
    app.route('/pangolin/own').get(getOwnPangolin);
    app.route('/pangolin/all').get(getAllPangolins);
    app.route('/pangolin/update/:id').put(updatePangolin);
}