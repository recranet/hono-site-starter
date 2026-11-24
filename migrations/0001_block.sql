-- The customer's text blocks (src/blocks.ts), as Portable Text JSON.
CREATE TABLE block (
	page TEXT NOT NULL,
	name TEXT NOT NULL,
	value TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	updated_by TEXT NOT NULL,
	PRIMARY KEY (page, name)
);
