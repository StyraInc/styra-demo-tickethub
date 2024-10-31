import { useAuthn } from "../AuthnContext";
import { useUsers } from "../UsersContext";
import { useAuthz } from "@styra/opa-react";

export default function Assignee({ ticket }) {
  const { user, tenant } = useAuthn();
  const { users } = useUsers();
  const usersSelect = users.map(({ name: value }) => ({
    value,
    label: capitalizeFirstLetter(value),
  }));
  usersSelect.unshift({ value: "none", label: "unassigned" });

  const { result: authorizedAssigner } = useAuthz("tickets/allow", {
    action: "assign",
    resource: "ticket",
  });

  const handleAssigneeChange = (ticket, assignee) => {
    ticket.assignee = assignee;
    if (assignee === "none") {
      fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${tenant} / ${user}`,
        },
      });
      return;
    }
    fetch(`/api/tickets/${ticket.id}/assign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
      body: JSON.stringify({ assignee }),
    });
  };

  return (
    <select
      defaultValue={ticket.assignee}
      onChange={(e) => handleAssigneeChange(ticket, e.target.value)}
      disabled={!authorizedAssigner}
    >
      {usersSelect.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

// Thanks SO: https://stackoverflow.com/a/1026087/993018
function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
