import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
export const records = sqliteTable(
  "records",
  {
    owner: text("owner").notNull(),
    id: text("id").notNull(),
    kind: text("kind").notNull(),
    data: text("data").notNull(),
    version: integer("version").notNull().default(1),
    updated: integer("updated").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.owner, t.id] }),
    index("idx_records_owner_kind").on(t.owner, t.kind),
  ],
);

// Credentials are AES-GCM encrypted; none are included in workspace exports.
export const whoopConnections = sqliteTable("whoop_connections", {
  owner: text("owner").primaryKey(),
  credentials: text("credentials"),
  snapshot: text("snapshot"),
  updated: integer("updated"),
  lease: text("lease"),
  leaseUntil: integer("lease_until").notNull().default(0),
});
export const whoopStates = sqliteTable("whoop_states", {
  owner: text("owner").primaryKey(),
  hash: text("hash").notNull(),
  expires: integer("expires").notNull(),
});
