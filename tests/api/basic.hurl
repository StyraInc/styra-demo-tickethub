GET http://{{host}}:4000/api/tickets/1
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
HTTP 200
[Asserts]
jsonpath "$.id" == 1
jsonpath "$.customer" == "Globex"
jsonpath "$.description" == "Dooms day device needs to be refactored"
jsonpath "$.resolved" == false
jsonpath "$.last_updated" isIsoDate

GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
HTTP 200
[Captures]
old_count: jsonpath "$.tickets" count

# Bob (reader) cannot create a ticket
POST http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / bob
[Cookies]
user: acmecorp / bob
{
  "customer": "Globex",
  "description": "Gibberish gibberish"
}
HTTP 403

POST http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
{
  "customer": "Globex",
  "description": "Gibberish gibberish"
}
HTTP 200
[Asserts]
jsonpath "$.description" == "Gibberish gibberish"
[Captures]
ticket_id: jsonpath "$.id"

# "all tickets" doesn't include other tenant's tickets
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / bob
[Cookies]
user: acmecorp / bob
HTTP 200
[Asserts]
jsonpath "$.tickets" count > {{old_count}}
jsonpath "$.tickets[*].customer" includes "Globex"
jsonpath "$.tickets[*].customer" includes "Sirius Cybernetics Corp."
jsonpath "$.tickets[*].customer" includes "Cyberdyne Systems Corp."
jsonpath "$.tickets[*].customer" not includes "Soylent Corp."
jsonpath "$.tickets[*].customer" not includes "Tyrell Corp."

GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer hooli / dylan
[Cookies]
user: hooli / dylan
HTTP 200
[Asserts]
jsonpath "$.tickets[*].customer" not includes "Globex"
jsonpath "$.tickets[*].customer" not includes "Sirius Cybernetics Corp."
jsonpath "$.tickets[*].customer" not includes "Cyberdyne Systems Corp."
jsonpath "$.tickets[*].customer" includes "Soylent Corp."
jsonpath "$.tickets[*].customer" includes "Tyrell Corp."

# Bob (reader) cannot resolve a ticket
POST http://{{host}}:4000/api/tickets/{{ticket_id}}/resolve
Content-Type: application/json
Authorization: Bearer acmecorp / bob
[Cookies]
user: acmecorp / bob
{ "resolved": true }
HTTP 403

# Ceasar (resolver) can resolve a ticket
POST http://{{host}}:4000/api/tickets/{{ticket_id}}/resolve
Content-Type: application/json
Authorization: Bearer acmecorp / ceasar
[Cookies]
user: acmecorp / ceasar
{ "resolved": true }
HTTP 200
[Asserts]
jsonpath "$.id" == {{ticket_id}}
jsonpath "$.resolved" == true

# Ceasar (resolver) can unresolve a previously resolved ticket
POST http://{{host}}:4000/api/tickets/{{ticket_id}}/resolve
Content-Type: application/json
Authorization: Bearer acmecorp / ceasar
[Cookies]
user: acmecorp / ceasar
{ "resolved": false }
HTTP 200
[Asserts]
jsonpath "$.id" == {{ticket_id}}
jsonpath "$.resolved" == false
jsonpath "$.last_updated" isIsoDate

# Get the last updated timestamp for the test ticket.
GET http://{{host}}:4000/api/tickets/{{ticket_id}}
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
HTTP 200
[Asserts]
jsonpath "$.resolved" == false
jsonpath "$.id" == {{ticket_id}}
[Captures]
test_ticket_last_update_timestamp: jsonpath "$.last_updated"

# Assert that the test ticket has not changed its last updated time (since we
# haven't updated it).
GET http://{{host}}:4000/api/tickets/{{ticket_id}}
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
HTTP 200
[Asserts]
jsonpath "$.id" == {{ticket_id}}
jsonpath "$.resolved" == false
jsonpath "$.last_updated" == {{test_ticket_last_update_timestamp}}

# Resolve ticket 1, then assert its last updated time has changed.
POST http://{{host}}:4000/api/tickets/{{ticket_id}}/resolve
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Options]
delay: 1s
[Cookies]
user: acmecorp / alice
{ "resolved": true }
HTTP 200
[Asserts]
jsonpath "$.id" == {{ticket_id}}
jsonpath "$.resolved" == true
jsonpath "$.last_updated" > {{test_ticket_last_update_timestamp}}
