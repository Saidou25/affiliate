// src/apolloClient.ts
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// 1️⃣ Determine your GraphQL endpoint
const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL
  : import.meta.env.VITE_API_BASE_URL;

// 2️⃣ Create an HTTP link to your server
const httpLink = createHttpLink({
  uri: API_BASE_URL,
});

// 3️⃣ Create a middleware link that reads your token from localStorage
const authLink = setContext((_, { headers }) => {
  // read the token from localStorage (where your login mutation stores it)
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      // if there’s a token, set the Authorization header
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// 4️⃣ Compose the links and create the Apollo Client
const client = new ApolloClient({
  // authLink runs first, then httpLink sends the request
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
