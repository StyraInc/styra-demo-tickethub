import { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz, AuthzContext } from "@styra/opa-react";

export default function Tickets() {
  const { user, tenant } = useAuthn();
  const { sdk } = useContext(AuthzContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();

  useEffect(() => {
    if (!user) return;
    fetch("/api/tickets", {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
    })
      .then((res) => res.json())
      .then(async ({ tickets }) => {
        const action = "resolve";
        const resource = "ticket";
        const inputs = Object.fromEntries(
          tickets.map(({ id, ...rest }) => [
            id,
            { ...rest, action, resource, user, tenant },
          ]),
        );
        const res = await sdk.evaluateBatch("tickets/allow", inputs, {
          rejectErrors: true,
          fallback: true,
        });
        return {
          tickets: tickets.map((t) => ({ ...t, resolveAllowed: res[t.id] })),
        };
      })
      .then((data) => setTickets(data.tickets));
  }, [tenant, user]);

  return (
    <main>
      <table id="ticket-list">
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Updated</th>
            <th>Customer</th>
            <th>Description</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {tickets?.map(
            ({
              id,
              last_updated,
              customer,
              description,
              resolved,
              resolveAllowed,
            }) => (
              <tr
                key={id}
                onClick={() =>
                  navigate(`/tickets/${id}`, {
                    state: {
                      id,
                      last_updated,
                      customer,
                      description,
                      resolved,
                      resolveAllowed,
                    },
                  })
                }
              >
                <td>{id}</td>
                <td>{last_updated}</td>
                <td>{customer}</td>
                <td>{description}</td>
                <td>{resolved ? "yes" : "no"}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      <Authz
        path="tickets/allow"
        input={{ action: "create", resource: "ticket" }}
        fallback={
          <Link disabled={true} to="/tickets/new">
            <button disabled={true}>+ New ticket</button>
          </Link>
        }
      >
        <Link to="/tickets/new">
          <button>+ New ticket</button>
        </Link>
      </Authz>
    </main>
  );
}
