CREATE TABLE "public"."Tenants" (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) UNIQUE
);

CREATE TABLE "public"."Customers" (
  id SERIAL PRIMARY KEY NOT NULL,
  tenant INTEGER NOT NULL,
  name VARCHAR(255),
  FOREIGN KEY ("tenant") REFERENCES "public"."Tenants"(id),
  UNIQUE (tenant, name)
);

CREATE TABLE "public"."Users" (
  id SERIAL PRIMARY KEY NOT NULL,
  tenant INTEGER NOT NULL,
  name VARCHAR(255),
  FOREIGN KEY ("tenant") REFERENCES "public"."Tenants"(id),
  UNIQUE (tenant, name)
);

CREATE TABLE "public"."Tickets" (
  id SERIAL PRIMARY KEY NOT NULL,
  description TEXT,
  last_updated TIMESTAMP NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  customer INTEGER NOT NULL,
  tenant INTEGER NOT NULL,
  assignee INTEGER,
  FOREIGN KEY ("customer") REFERENCES "public"."Customers"(id),
  FOREIGN KEY ("tenant") REFERENCES "public"."Tenants"(id),
  FOREIGN KEY ("assignee") REFERENCES "public"."Users"(id)
);

INSERT INTO "Tenants" (id, name) VALUES (1, 'hooli'), (2, 'acmecorp');

INSERT INTO "Users" (tenant, name) VALUES (2, 'alice'), (2, 'bob'), (2, 'ceasar'), (1, 'dylan'), (1, 'eva'), (1, 'frank');

INSERT INTO "Customers" (tenant, name) VALUES
  (2, 'Globex'),
  (2, 'Sirius Cybernetics Corp.'),
  (2, 'Cyberdyne Systems Corp.'),
  (1, 'Soylent Corp.'),
  (1, 'Tyrell Corp.');

INSERT INTO "Tickets" (tenant, customer, description, resolved, assignee) VALUES
  (2, 1, 'Dooms day device needs to be refactored', FALSE, 3),
  (2, 1, 'Flamethrower implementation is too heavyweight', TRUE, 3),
  (2, 2, 'Latest android exhibit depression tendencies', FALSE, 3),
  (2, 2, 'Happy Vertical People Transporters need to be more efficient in determining destination floor', FALSE, NULL),
  (2, 3, 'Mimetic polyalloy becomes brittle at low temperatures', FALSE, NULL),
  (2, 3, 'Temporal dislocation field reacts with exposed metal', TRUE, NULL),
  (1, 4, 'Final ingredient for project ''Green'' still undecided', FALSE, NULL),
  (1, 4, 'Customer service center switch board DDoS:ed by (opinionated) ingredient declaration inquiries', TRUE, NULL),
  (1, 5, 'Replicants become too independent over time', FALSE, NULL),
  (1, 5, 'Detective Rick Deckard''s billing address is unknown', FALSE, NULL);
