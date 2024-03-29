import {
  ActionList,
  Card,
  Text,
  Image,
  Layout,
  Page,
  Stack,
  Link,
  TextContainer,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import trophyImgUrl from "../assets/home-trophy.png";
import React, { Suspense } from "react";
const ProductsCard = React.lazy(() => import("../components/ProductsCard"));
import mixpanel from "../lib/mixpanel.js";

const updateMixPanel = () => {
  mixpanel.then((mp) => {
    mp.track("HomePage View", {
      source: "Some source",
    });
  });
};

export default function HomePage() {
  updateMixPanel();

  const navigate = useNavigate();
  const pagesLinks = [
    {
      content: "Page Index Example",
      helpText: "Page Index route",
      onAction: () => navigate("/PageIndex"),
    },
    {
      content: "Page Generic Example",
      helpText: "Page Generic route",
      onAction: () => navigate("/PageGeneral"),
    },
  ];

  return (
    <Page fullWidth>
      <TitleBar title="App name" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Text variant="headingMd" as="h1">
                    Nice work on building a Shopify app 🎉🎉
                  </Text>
                  <p>
                    Your app is ready to explore! It contains everything you
                    need to get started including the{" "}
                    <Link url="https://polaris.shopify.com/" external>
                      Polaris design system
                    </Link>
                    ,{" "}
                    <Link url="https://shopify.dev/api/admin-graphql" external>
                      Shopify Admin API
                    </Link>
                    , and{" "}
                    <Link
                      url="https://shopify.dev/apps/tools/app-bridge"
                      external
                    >
                      App Bridge
                    </Link>{" "}
                    UI library and components.
                  </p>

                  <p>
                    Learn more about building out your app in{" "}
                    <Link
                      url="https://shopify.dev/apps/getting-started/add-functionality"
                      external
                    >
                      this Shopify tutorial
                    </Link>{" "}
                    📚{" "}
                  </p>
                </TextContainer>
              </Stack.Item>
              <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source={trophyImgUrl}
                    alt="Nice work on building a Shopify app"
                    width={120}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Suspense fallback={<div>Loading...</div>}>
            <ProductsCard />
          </Suspense>
        </Layout.Section>
        <Layout.Section fullWidth>
          <Card>
            <ActionList actionRole="menuitem" items={pagesLinks} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
