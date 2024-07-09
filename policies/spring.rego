package tickets.spring

default main = {"decision": false}

authHeader := input.action.headers.Authorization
tenant := trim(split(authHeader, "/")[0], " \t")
user := trim(split(authHeader, "/")[1], " \t")

action := a {
    input.action.name == "GET"
    input.resource.id == "/tickets"
    a := "list"
} else := a {
    input.action.name == "POST"
    input.resource.id == "/tickets"
    a := "create"

    # TODO: the other actions
}

xform := {
    "user": user,
    "tenant": tenant,
    "action": action,
}

main = x {
    d := data.tickets.allow with xform as input
    x := {
        "decision": d,
        "context": {
            "reason": "sample policy"
        }
    }
}
