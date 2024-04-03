GET http://{{host}}:4000/api/tickets/1
Content-Type: application/json
[Cookies]
user: acmecorp / alice
HTTP 200
[Asserts]
jsonpath "$.id" == 1
jsonpath "$.customer" == "Globex"
jsonpath "$.description" == "Dooms day device needs to be refactored"
jsonpath "$.resolved" == false

GET http://{{host}}:4000/api/tickets
Content-Type: application/json
[Cookies]
user: acmecorp / alice
HTTP 200
[Captures]
old_count: jsonpath "$.tickets" count

# Bob (reader) cannot create a ticket
POST http://{{host}}:4000/api/tickets
Content-Type: application/json
[Cookies]
user: acmecorp / bob
{
  "customer": "Globex",
  "description": "Gibberish gibberish"
}
HTTP 403

POST http://{{host}}:4000/api/tickets
Content-Type: application/json
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
[Cookies]
user: acmecorp / bob
{ "resolved": true }
HTTP 403

# Ceasar (resolver) can resolve a ticket
POST http://{{host}}:4000/api/tickets/{{ticket_id}}/resolve
Content-Type: application/json
[Cookies]
user: acmecorp / ceasar
{ "resolved": true }
HTTP 200
[Asserts]
jsonpath "$.id" == {{ticket_id}}
jsonpath "$.resolved" == true
