import { ApolloClient, InMemoryCache } from "@apollo/client";
// Get the base URL from the environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const client = new ApolloClient({
    uri: API_BASE_URL,
    cache: new InMemoryCache(),
});
export default client;
