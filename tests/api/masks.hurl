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
jsonpath "$.tickets[*].description" count >= 5
jsonpath "$.tickets[0].description" != "***" # description not masked for admins
jsonpath "$.tickets[1].description" != "***"
jsonpath "$.tickets[2].description" != "***"
jsonpath "$.tickets[3].description" != "***"
jsonpath "$.tickets[4].description" != "***"

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
jsonpath "$.tickets[*].description" count >= 5
jsonpath "$.tickets[0].description" != "***" # description not masked for resolvers
jsonpath "$.tickets[1].description" != "***"
jsonpath "$.tickets[2].description" != "***"
jsonpath "$.tickets[3].description" != "***"
jsonpath "$.tickets[4].description" != "***"

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
jsonpath "$.tickets[*].description" count >= 5
jsonpath "$.tickets[0].description" == "***" # description masked for readers
jsonpath "$.tickets[1].description" == "***"
jsonpath "$.tickets[2].description" == "***"
jsonpath "$.tickets[3].description" == "***"
jsonpath "$.tickets[4].description" == "***"
