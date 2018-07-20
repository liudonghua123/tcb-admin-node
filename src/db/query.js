"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./request");
const validate_1 = require("./validate");
const util_1 = require("./util");
const command_1 = require("./command");
class Query {
    constructor(db, coll, fieldFilters, fieldOrders, queryOptions) {
        this._db = db;
        this._coll = coll;
        this._fieldFilters = fieldFilters;
        this._fieldOrders = fieldOrders || [];
        this._queryOptions = queryOptions || {};
        this._request = new request_1.Request(this._db);
    }
    get() {
        let newOder = [];
        if (this._fieldOrders) {
            this._fieldOrders.forEach(order => {
                newOder.push(JSON.stringify(order));
            });
        }
        let param = {
            collectionName: this._coll
        };
        if (this._fieldFilters) {
            param.query = this._fieldFilters;
        }
        if (newOder.length > 0) {
            param.order = newOder;
        }
        if (this._queryOptions.offset) {
            param.offset = this._queryOptions.offset;
        }
        if (this._queryOptions.limit) {
            param.limit =
                this._queryOptions.limit < 100 ? this._queryOptions.limit : 100;
        }
        else {
            param.limit = 100;
        }
        if (this._queryOptions.projection) {
            param.projection = this._queryOptions.projection;
        }
        return new Promise(resolve => {
            this._request.send("queryDocument", param).then(res => {
                if (res.code) {
                    resolve(res);
                }
                else {
                    const documents = util_1.Util.formatResDocumentData(res.data.list);
                    resolve({
                        data: documents,
                        requestId: res.requestId,
                        total: res.TotalCount,
                        limit: res.Limit,
                        offset: res.Offset
                    });
                }
            });
        });
    }
    where(query) {
        return new Query(this._db, this._coll, this.convertParams(query), this._fieldOrders, this._queryOptions);
    }
    orderBy(fieldPath, directionStr) {
        validate_1.Validate.isFieldPath(fieldPath);
        validate_1.Validate.isFieldOrder(directionStr);
        const newOrder = {
            field: fieldPath,
            direction: directionStr
        };
        const combinedOrders = this._fieldOrders.concat(newOrder);
        return new Query(this._db, this._coll, this._fieldFilters, combinedOrders, this._queryOptions);
    }
    limit(limit) {
        validate_1.Validate.isInteger("limit", limit);
        let option = Object.assign({}, this._queryOptions);
        option.limit = limit;
        return new Query(this._db, this._coll, this._fieldFilters, this._fieldOrders, option);
    }
    skip(offset) {
        validate_1.Validate.isInteger("offset", offset);
        let option = Object.assign({}, this._queryOptions);
        option.offset = offset;
        return new Query(this._db, this._coll, this._fieldFilters, this._fieldOrders, option);
    }
    update(data) {
        let param = {
            collectionName: this._coll,
            query: this._fieldFilters,
            multi: true,
            merge: true,
            upsert: false,
            data: this.convertParams(data)
        };
        return new Promise(resolve => {
            this._request.send("updateDocument", param).then(res => {
                if (res.code) {
                    resolve(res);
                }
                else {
                    resolve({
                        requestId: res.requestId,
                        updated: res.data.updated,
                        upsertId: res.data.upsert_id
                    });
                }
            });
        });
    }
    field(projection) {
        let option = Object.assign({}, this._queryOptions);
        option.projection = projection;
        this._queryOptions = option;
        return this.get();
    }
    convertParams(query) {
        let queryParam = {};
        if (query instanceof command_1.Command) {
            queryParam = query.parse();
        }
        else {
            for (let key in query) {
                if (query[key] instanceof command_1.Command) {
                    queryParam = Object.assign({}, queryParam, query[key].parse(key));
                }
                else if (typeof query[key] === "object") {
                    let command = new command_1.Command();
                    let tmp = command.concatKeys({ [key]: query[key] });
                    if (tmp.value instanceof command_1.Command) {
                        tmp.value = tmp.value.parse(tmp.keys);
                    }
                    queryParam = Object.assign({}, queryParam, { [tmp.keys]: tmp.value });
                }
                else {
                    queryParam = Object.assign({}, queryParam, { [key]: query[key] });
                }
            }
        }
        return queryParam;
    }
}
exports.Query = Query;
