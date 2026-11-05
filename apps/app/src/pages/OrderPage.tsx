import { useParams } from "react-router";

export function OrderPage() {
  const { orderId } = useParams();
  return (
    <>
      <h1>Order confirmation</h1>
      <p>
        Order <span>{orderId}</span>
      </p>
    </>
  );
}
