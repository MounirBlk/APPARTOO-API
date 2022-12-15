import request from "supertest"
import { convertToFormBody, exist, getTimeout, randNumber, randomChars, randomFileName } from "../helpers";
import app from "../../app";
import ScenarioModel from "../../src/models/ScenarioModel";

export const htmlSpec = () => {
    it('Test index.html', (done: DoneFn) => {
        request(app).get('').expect(200, done);
    }, getTimeout());

    it('Test error.html', (done: DoneFn) => {
        request(app).get(`/${randomChars()}${randNumber(1, 100)}`).expect(404, done);
    }, getTimeout());
}