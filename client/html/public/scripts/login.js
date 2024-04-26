import accounts from "./users.js";

initialize();

function initialize() {
  window.login = login;
  displayUsers();
  login(false);
}

// Renders the user dropdown menu
function displayUsers() {
  let [currentAccount] = accounts;

  document.cookie.split("; ").forEach((cookie) => {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === "user") {
      currentAccount = cookieValue;
    }
  });

  const menu = document.getElementById("login-menu");
  const tenantUsers = accounts.reduce((tenantUsers, account) => {
    const [tenant, user] = account.split("/").map((account) => account.trim());
    tenantUsers[tenant] ??= [];
    tenantUsers[tenant].push({ account, name: user });
    return tenantUsers;
  }, {});

  const [currentTenant, currentUser] = currentAccount
    .split("/")
    .map((account) => account.trim());

  menu.innerHTML = `\
  <form id="login">
    <label for="account-select">User</label>
    <select id="account-select" name="account" class="account" onchange="login(true)">
      ${Object.entries(tenantUsers)
        .map(
          ([tenant, users]) =>
            `<optgroup label="${tenant}">
          ${users.map(({ name, account }) => {
            const selected = currentTenant === tenant && currentUser === name;
            return `<option ${selected ? "selected" : ""} value="${account}">${name}</option>`;
          })}
        </optgroup>`,
        )
        .join("")}
    </select>
  </form>`;

  // Update tenant
  document.title = `${document.title} - ${currentTenant}`;
  document.getElementById("tenant").textContent = currentTenant;
}

function login(reload) {
  const [user] = document.getElementsByName("account");
  document.cookie = `user=${user.value}; Path=/; SameSite=Lax`;
  if (reload) {
    location.reload();
  }
}
