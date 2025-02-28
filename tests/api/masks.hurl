# masks are currently applied by roles, so we use acmecorp/ceasar, and acmecorp/bob.

# baseline: get all tickets as admin
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
[Options]
skip: {{skip_masking}}
HTTP 200
[Asserts]
jsonpath "$.tickets" count >= 1 # fresh setup has 6 tickets
jsonpath "$.tickets[*].description" != "***" # description not masked for admins
[Captures]
all_count: jsonpath "$.tickets" count

# resolver LIST
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / ceasar
[Cookies]
user: acmecorp / ceasar
[Options]
skip: {{skip_masking}}
HTTP 200
[Asserts]
jsonpath "$.tickets" count >= 1
jsonpath "$.tickets[*].description" != "***" # description not masked for resolvers
[Captures]
all_count: jsonpath "$.tickets" count

# ensure readers only see masked tickets
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / bob
[Cookies]
user: acmecorp / bob
[Options]
skip: {{skip_masking}}
HTTP 200
[Asserts]
jsonpath "$.tickets" count >= 1
jsonpath "$.tickets[*].description" == "***" # description masked for readers
[Captures]
all_count: jsonpath "$.tickets" count