import React from "react";
import { Link } from "react-router-dom";
import { Card, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export const NFTCard = ({ metadata }) => {
  const { image, name, tokenId } = metadata;

  return (
    <Card
      hoverable
      cover={
        <div
          style={{
            backgroundImage: `url(${image})`,
            width: "100%",
            height: "195px",
            backgroundSize: "cover",
            backgroundPosition: "30%",
          }}
        />
      }
    >
      <Title level={5} className="listing-card__price">
        {name}
      </Title>
      <Text strong ellipsis className="listing-card__title">
        Token #{tokenId}
      </Text>
    </Card>
  );
};
