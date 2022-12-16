import request from "supertest"
import app from "../../app";

export const htmlSpec = () => {
    it('Test index.html', (done: DoneFn) => {
        request(app).get('').expect(200, done);
    }, 60000);

    it('Test error.html', (done: DoneFn) => {
        request(app).get(`/error`).expect(404, done);
    }, 60000);
}