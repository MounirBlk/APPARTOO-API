
import request from "supertest"
import app from "../app";
import * as index from "./routes/index.spec";

console.log('PORT =>', app.get('port'))

beforeAll(async() => {
    console.log('START');
}, 60000); // Before all tests of specs

describe('TEST API', () => {
    index.htmlSpec();
});

