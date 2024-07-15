import PropTypes from "prop-types";
import { useCallback } from "react";
import { Types } from "../types";
import { useParams, Link } from "react-router-dom";
import { useAuthn } from "../AuthnContext";

export default function Nav({ accounts, type }) {
  const { tenant } = useAuthn();
  const { ticketId } = useParams();

  const tickets =
    type === Types.TICKETS ? "Tickets" : <Link to="/">Tickets</Link>;
  const newTicket = type === Types.NEW_TICKET ? "New" : undefined;

  return (
    <nav>
      <div>
        <h1>{tenant}</h1>
        <div className="nav-menu">
          <span>{tickets}</span>
          {(ticketId || newTicket) && (
            <>
              <span>/</span>
              <span>{ticketId ?? newTicket}</span>
            </>
          )}
        </div>
      </div>

      <Menu accounts={accounts} />
    </nav>
  );
}

Nav.propTypes = {
  type: PropTypes.oneOf(Object.values(Types)),
  ticketId: PropTypes.string,
};

function Menu({ accounts }) {
  const { user, tenant, setUser, setTenant } = useAuthn();

  const handleChangeAccount = useCallback(
    ({ target: { value } }) => {
      const [tenant, user] = value.split("/");
      setUser(user);
      setTenant(tenant);
      document.cookie = `user=${tenant} / ${user}; Path=/; SameSite=Lax`;
    },
    [setUser, setTenant],
  );

  if (!user || !tenant || !accounts) {
    return null;
  }
  return (
    <div className="login-menu">
      <label>
        User{" "}
        <select
          className="login-select"
          value={`${tenant}/${user}`}
          onChange={handleChangeAccount}
        >
          {Object.entries(accounts).map(([tenant, users]) => (
            <optgroup key={tenant} label={tenant}>
              {users.map(({ name }) => (
                <option key={`${tenant}/${name}`} value={`${tenant}/${name}`}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
