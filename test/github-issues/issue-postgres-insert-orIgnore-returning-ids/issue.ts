import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {User} from "./entity/User";

describe("queryBuilder for a query with insert + ignore and ReturnResult updating entity ids", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["postgres"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it('should correctly assign entity IDs for successfully inserted rows', () => Promise.all(connections.map(async connection => {
        const qb = connection.createQueryBuilder();

        const u1 = Object.assign(new User(), {name: 'user1'})
        const insertedUser1Id = (await qb
            .insert()
            .into(User)
            .values([u1])
            .execute()
        ).identifiers[0].id;

        const newU1 = Object.assign(new User(), {name: 'user1'})
        const u2 = Object.assign(new User(), {name: 'user2'})

        const partialUpsertResult = (await qb
                .insert()
                .into(User)
                .values([newU1, u2])
                .orIgnore(true)
                .execute()
        ).identifiers

        expect(partialUpsertResult[0].id).equal(insertedUser1Id);
        expect(partialUpsertResult[1].id).not.equal(undefined);
    })));
})
