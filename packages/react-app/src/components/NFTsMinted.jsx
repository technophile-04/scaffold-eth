import React from "react";
import { List, Typography } from "antd";
import { NFTCard } from "./NFTCard";

const { Paragraph, Title } = Typography;

export const NFTsMinted = ({ data, setPageNumber, pageNumber, loading }) => {
  const total = data?.total;
  const result = data;

  const userListingsList = (
    <List
      grid={{
        gutter: 12,
        column: 6,
      }}
      dataSource={result}
      loading={loading}
      locale={{ emptyText: "No NFT's found" }}
      className={"nftMint_list"}
      pagination={{
        position: "top",
        current: pageNumber,
        total,
        simple: true,
        defaultPageSize: 6,
        hideOnSinglePage: true,
        showQuickJumper: false,
        onChange: page => {
          setPageNumber(page);
        },
      }}
      renderItem={metadata => (
        <List.Item>
          <NFTCard metadata={metadata} />
        </List.Item>
      )}
    />
  );

  return (
    <div>
      <Title level={4} style={{ marginTop: "2.5rem", marginBottom: "0" }}>
        Total NFTs Minted ({total})
      </Title>
      {userListingsList}
    </div>
  );
};
