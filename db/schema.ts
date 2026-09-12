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
