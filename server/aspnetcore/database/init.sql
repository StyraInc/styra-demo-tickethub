CREATE TABLE "public"."Tenants" (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) UNIQUE,
  region VARCHAR(255)
);

CREATE TABLE "public"."Customers" (
  id SERIAL PRIMARY KEY NOT NULL,
  tenant INTEGER NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  FOREIGN KEY ("tenant") REFERENCES "public"."Tenants"(id),
  UNIQUE (tenant, name)
);

CREATE TABLE "public"."Users" (
  id SERIAL PRIMARY KEY NOT NULL,
  tenant INTEGER NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
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

INSERT INTO "Tenants" (id, name, region) VALUES (1, 'hooli', 'EU'), (2, 'acmecorp', 'NA');

INSERT INTO "Users" (tenant, name, email) VALUES
  (2, 'alice', 'alice@acmecorp.com'),
  (2, 'bob', 'bob@acmecorp.com'),
  (2, 'ceasar', 'ceasar@acmecorp.com'),
  (1, 'dylan', 'dylan@acmecorp.com'),
  (1, 'eva', null),
  (1, 'frank', 'frank@acmecorp.com');

INSERT INTO "Customers" (tenant, name, email, phone) VALUES
  (2, 'Globex', 'hank.scorpio@globex.com', '+1-555-0123'),  -- USA
  (2, 'Sirius Cybernetics Corp.', 'complaints@siriuscyber.net', '+44-555-4608'),  -- UK
  (2, 'Cyberdyne Systems Corp.', 'miles.dyson@cyberdyne.com', '+1-555-2144'),  -- USA
  (1, 'Soylent Corp.', 'info@soylentgreen.com', '+49-555-6789'),  -- Germany
  (1, 'Tyrell Corp.', 'eldon.tyrell@tyrellcorp.com', '+81-555-3247');  -- Japan

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
