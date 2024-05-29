import PropTypes from "prop-types";
import { useCallback } from "react";
import { Types } from "../types";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";

export default function Nav({ type }) {
  const { current } = useAuthn();
  const { ticketId } = useParams();

  const tickets =
    type === Types.TICKETS ? "Tickets" : <Link to="/">Tickets</Link>;
  const newTicket = type === Types.NEW_TICKET ? "New" : undefined;

  return (
    <nav>
      <div>
        <h1>{current?.tenant}</h1>
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

      <Menu />
    </nav>
  );
}

Nav.propTypes = {
  type: PropTypes.oneOf(Object.values(Types)),
  ticketId: PropTypes.string,
};

function Menu() {
  const { current, accounts, handleSetAccount } = useAuthn();
  const navigate = useNavigate();

  const handleChangeAccount = useCallback(
    (event) => {
      handleSetAccount(event.target.value);
      navigate(`/?user=${event.target.value}`);
    },
    [handleSetAccount],
  );

  if (!current || !accounts) {
    return null;
  }

  return (
    <div className="login-menu">
      <span>
        User{" "}
        <select
          className="login-select"
          value={current.account}
          onChange={handleChangeAccount}
        >
          {Object.entries(accounts).map(([tenant, users]) => (
            <optgroup key={tenant} label={tenant}>
              {users.map(({ name, account }) => (
                <option key={account} value={account}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </span>
    </div>
  );
}
