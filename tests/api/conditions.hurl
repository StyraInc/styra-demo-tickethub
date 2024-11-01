# conditions currently only apply to the "resolver" user, acmecorp/ceasar

# baseline: get all tickets as admin
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / alice
[Cookies]
user: acmecorp / alice
HTTP 200
[Asserts]
jsonpath "$.tickets" count >= 6 # fresh setup has 6 tickets
jsonpath "$.tickets[*].resolved" includes true # both resolved and unresolved tickets
jsonpath "$.tickets[*].resolved" includes false
[Captures]
all_count: jsonpath "$.tickets" count

# resolver LIST
GET http://{{host}}:4000/api/tickets
Content-Type: application/json
Authorization: Bearer acmecorp / ceasar
[Cookies]
user: acmecorp / ceasar
[Options]
skip: {{skip_conditions}}
HTTP 200
[Asserts]
jsonpath "$.tickets" count < {{all_count}}
# all those jsonpath expressions yield at most one-element arrays
jsonpath "$.tickets[?(@.id == 4)].resolved" includes false
jsonpath "$.tickets[?(@.id == 4)].assignee" not exists
jsonpath "$.tickets[?(@.id == 2)].resolved" includes true
jsonpath "$.tickets[?(@.id == 2)].assignee" includes "ceasar"
