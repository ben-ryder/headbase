import { SuperAgentTest } from "supertest";
import {getTestApp} from "../../../tests/e2e/test-app";

let testApp: SuperAgentTest;

describe('Base Route',() => {

  beforeAll(async () => {
    testApp = await getTestApp();
  })

  /**
   * Base Route (/)
   */
  describe('/ [GET]', () => {
    it('When a request is made, Then the response should have a 200 status code', async () => {
      await testApp.get('/').expect(200);
    })

    it('When a request is made, Then the response should be a string message', async () => {
      const {body: data} = await testApp.get('/');
      expect(data).toBeInstanceOf(String);
    })

    // When a request is made without authorization, Then the response should still succeed
    // This is naturally tested as part of the above tests.
  })

  /**
   * Base V1 Route (/v1)
   */
  describe('/v1 [GET]', () => {
    it('When a request is made, Then the response should have a 200 status code', async () => {
      await testApp.get('/').expect(200);
    })

    it('When a request is made, Then the response should be a string message', async () => {
      const {body: data} = await testApp.get('/');
      expect(data).toBeInstanceOf(String);
    })

    // When a request is made without authorization, Then the response should still succeed
    // This is naturally tested as part of the above tests.
  })
})