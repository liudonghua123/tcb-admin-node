import * as assert from "power-assert";
import { Db } from "../../../src/database";
import { ErrorCode } from "../../../src/database/constant";
// import * as Mock from "./mock";
import * as Config from '../../config.local'
import * as common from '../../common'

describe("test/unit/collection.test.ts", async () => {
  const collName = "coll-1";
  const db = new Db({
    secretId: Config.secretId,
    secretKey: Config.secretKey,
    env: Config.env,
    mpAppId: Config.appId,
    config: Config
  });
  const collection = db.collection(collName);


  it("name test", async () => {
    assert(collection.name === collName);
    await common.safeCreateCollection(db, collName)
  });

  it("Error - use invalid docId to get reference", () => {
    const docId = "abcdefg";
    try {
      collection.doc(docId);
    } catch (e) {
      assert(e.message === ErrorCode.DocIDError);
    }
  });

  it("API - get all data", async () => {
    const res = await collection.get();
    assert(Array.isArray(res.data));
  });

  // it("API - use where", async () => {
  //   const field = "name";
  //   const value = "huming";
  //   const opStr = "==";
  //   const data = await collection.where(field, opStr, value).get();
  //   assert(Array.isArray(data.data));
  // });

  it("API - use orderBy", async () => {
    const field = "huming";
    const direction = "asc";
    const data = await collection.orderBy(field, direction).get();
    assert(Array.isArray(data.data));
  });

  it("API - use limit", async () => {
    const limit = 1;
    const data = await collection.limit(limit).get();
    assert(Array.isArray(data.data) && data.data.length === limit);
  });

  it("API - use offset", async () => {
    const offset = 2;
    const data = await collection.skip(offset).get();
    assert(Array.isArray(data.data));
  });

  it("API - add one doc, update and remove", async () => {
    const res = await collection.add({
      name: "huming"
    });
    assert(res);

    const data = await collection.where({
      name: db.command.eq('huming')
    }).update({
      age: 18
    });
    assert(data.updated > 0);

    const remove = await collection.where({
      name: db.command.eq('huming')
    }).remove()

    assert(remove.deleted > 0)
  });

  it('API - use field', async () => {
    await db.createCollection(collName)
    const res = await collection.field({ 'age': 1 }).get();
    assert(Array.isArray(res.data))
  })

});
