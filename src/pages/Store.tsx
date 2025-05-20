import { Col, Row } from "react-bootstrap";
import { StoreItem } from "../components/StoreItem";
import axios from "axios";
import React, { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

export function Store() {
  const [array, setArray] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get<Product[]>(
        "http://127.0.0.1:8000/public/products"
      );
      console.log(response.data);
      setArray(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <section>
      <div className="container">
        <h1>Store</h1>
        <Row md={3} xs={2} lg={4} className="g-3">
          {array.map((item) => (
            <Col key={item.id}>
              <StoreItem {...item} />
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}