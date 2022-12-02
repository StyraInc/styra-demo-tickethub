import React, {useMemo, useState} from 'react'

export default function useAccounts() {
  const [current, setCurrent] = useState(getAccountFromCookie())
  const [accounts, setAccounts] = useState()
  
  React.useEffect(() => {
    fetch('/accounts.json')
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts.reduce((accounts, account) => {
          const {tenant, user} = getTenantUser(account);
          accounts[tenant] ??= [];
          accounts[tenant].push({account, name: user});
          return accounts;
        }, {}))
      })
  }, [])

  React.useEffect(() => {
    if (!accounts || current) {
      return
    }

    const [tenant] = Object.values(accounts)
    const [user] = tenant
    setAccountCookie(user.account)
    setCurrent(getTenantUser(user.account))
  }, [accounts, current])

  return useMemo(() => {
    return {
      current,
      accounts,
      handleSetAccount: (account) => {
        setAccountCookie(account)
        setCurrent({account})
      }
    }
  }, [current, accounts])
}

function getAccountFromCookie() {
  let current
  document.cookie.split('; ').forEach((cookie) => {
    const [cookieName, cookieAccount] = cookie.split('=')
    if (cookieName === 'user') {
      current = getTenantUser(cookieAccount)
    }
  })
  return current
}

function setAccountCookie(account) {
  document.cookie = `user=${account}; Path=/; SameSite=Lax`
}

function getTenantUser(account) {
  const [tenant, user] = account.split('/').map((account) => account.trim());
  return {tenant, user, account} 
}