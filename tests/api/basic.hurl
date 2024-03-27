GET http://{{host}}:4000/api/tickets/0
Content-Type: application/json
[Cookies]
user: acmecorp / alice
HTTP 200
{"id":"0","customer":"Globex","last_updated":"2022-07-19T15:39:53Z","description":"Dooms day device needs to be refactored","resolved":false}

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

GET http://{{host}}:4000/api/tickets
Content-Type: application/json
[Cookies]
user: acmecorp / bob
HTTP 200
[Asserts]
jsonpath "$.tickets" count > {{old_count}}

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
jsonpath "$.id" == "{{ticket_id}}" # eek, it's a string now
jsonpath "$.resolved" == true
