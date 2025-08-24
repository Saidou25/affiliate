
import axios from "axios";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  title: string;
  amount: number;
  created_at: string;
  status: string;
}

export default function HostingerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
console.log(orders);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/hostinger-orders");
        setOrders(res.data.orders);
      } catch (error) {
        console.error("❌ Failed to load orders:", error);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Hostinger Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.title}</td>
              <td>{order.amount}</td>
              <td>{order.status}</td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
