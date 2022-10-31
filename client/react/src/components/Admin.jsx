import React from 'react'

export default function Admin() {
  return (
    <main>
      <p>This page has not been implemented yet. Go to the Build Permission Management step to learn how.</p>
    </main>
  )
}

function RbacManagement({disabled, path}) {
  const [roles, setRoles] = useState([])
  const [userBindings, setUserBindings] = useState([])

  const {current} = useAccounts()

  const fetchUserBindings = useCallback(() => {
    fetch(`${path}/user_bindings`)
      .then((res) => res.json())
      .then(({result}) => setUserBindings(result))
  }, [path, setUserBindings])

  const handleChangeRole = useCallback(async (userBinding) => {
    await fetch(`${path}/user_bindings/${userBinding.id}`, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(userBinding.roles)
    })

    fetchUserBindings()
  }, [path, fetchUserBindings])

  useEffect(() => {
    fetch(`${path}/roles`)
      .then((res) => res.json())
      .then(({result}) => setRoles(result))

    fetchUserBindings()
  }, [path, setRoles, fetchUserBindings])

  if (!userBindings || !roles) {
    return null
  }

  if (disabled) {
    return 'You are unauthorized for user role management.'
  }

  return (
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {userBindings.map((userBinding, index) => {
          const [userRole] = userBinding.roles
          const handleChange = (event) => {
            const roles = [event.target.value]
            handleChangeRole({...userBinding, roles})

            const bindings = [...userBindings]
            bindings[index].roles = roles
            setUserBindings(bindings)
          }

          const isCurrentUser = current.user.endsWith(userBinding.id)

          return (
            <tr key={userBinding.id}>
              <td>
                {userBinding.id} {isCurrentUser && <i>(you)</i>}
              </td>
              <td>
                { isCurrentUser && 
                  <span>{userRole}</span>
                }
                { !isCurrentUser && 
                  <select value={userRole} onChange={handleChange}>
                    {roles.map((role) => <option key={role}>{role}</option>)}
                  </select>
                }
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

RbacManagement.propTypes = {
  disabled: PropTypes.bool,
  path: PropTypes.string.isRequired
}