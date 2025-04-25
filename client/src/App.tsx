import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
    }
  }
`;

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { data, loading, error } = useQuery(GET_USERS);


  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      console.log('User created:', data.createUser);
    },
    onError: (error) => {
      console.error('Error creating user:', error.message);
    }
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser({ variables: { name, email } });
  };

  return (
    <div>
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Create User</button>
      </form>
      <h2>All Users</h2>
      {loading && <p>Loading users...</p>}
      {error && <p>Error fetching users: {error.message}</p>}
      {data && data.getUsers.map((user: any) => (
        <div key={user.id}>
          <strong>{user.name}</strong> - {user.email}
        </div>
      ))}
    </div>
  );
}

export default App;
