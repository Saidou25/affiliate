import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { nanoid } from "nanoid";
import { useReferralCode } from "./hooks/useReferralCode";
import "./index.css";
const REGISTER_AFFILIATE = gql `
  mutation RegisterAffiliate(
    $name: String!
    $email: String!
    $refId: String!
    $totalClicks: Int!
    $totalCommissions: Int!
  ) {
    registerAffiliate(
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
    ) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;
const GET_AFFILIATES = gql `
  query GetAffiliates {
    getAffiliates {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;
function App() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [refId, setRefId] = useState("");
    const [totalClicks, setTotalClicks] = useState("");
    const [totalCommissions, setTotalCommissions] = useState("");
    const referralCode = useReferralCode();
    console.log("reference code: ", referralCode);
    const { data, loading, error } = useQuery(GET_AFFILIATES);
    const [registerAffiliate] = useMutation(REGISTER_AFFILIATE, {
        onCompleted: (data) => {
            console.log("User created:", data.registerAffiliate);
        },
        onError: (error) => {
            console.error("Error creating user:", error.message);
        },
    });
    const dynamicReferralCode = nanoid(8);
    // const linkStructure = `https://princetongreen.org/?ref=${refId}`;
    const deleteAffiliate = (refId) => {
        // console.log(data);
        // console.log(referralCode);
        // console.log(refId);
        if (refId === referralCode) {
            // const affiliate = data.getAffiliates.filter(
            //   (d: Affiliate) => d.refId === referralCode
            // );
            // console.log(affiliate[0].name);
            console.log("yes: ", refId);
        }
        else {
            console.log("not the one");
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        registerAffiliate({
            variables: {
                name,
                email,
                refId: dynamicReferralCode,
                totalClicks: +totalClicks,
                totalCommissions: +totalCommissions,
            },
        });
    };
    return (_jsxs("div", { children: [_jsx("h1", { children: " Register Affiliate" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Name" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email" }), _jsx("input", { type: "text", value: refId, onChange: (e) => setRefId(e.target.value), placeholder: "ref id" }), _jsx("input", { type: "number", value: totalClicks, onChange: (e) => setTotalClicks(e.target.value), placeholder: "total clicks" }), _jsx("input", { type: "number", value: totalCommissions, onChange: (e) => setTotalCommissions(e.target.value), placeholder: "total comission" }), _jsx("button", { type: "submit", children: "Create User" })] }), _jsx("h2", { children: "All Users" }), loading && _jsx("p", { children: "Loading users..." }), error && _jsxs("p", { children: ["Error fetching users: ", error.message] }), data &&
                data.getAffiliates.map((affiliate) => (_jsxs("div", { children: [_jsx("strong", { children: affiliate.name }), " - ", affiliate.email, " -", " ", affiliate.refId, " - ", affiliate.totalClicks, " -", " ", affiliate.totalCommissions, _jsx("button", { onClick: () => deleteAffiliate(affiliate.refId), children: "delete" })] }, affiliate.id)))] }));
}
export default App;
