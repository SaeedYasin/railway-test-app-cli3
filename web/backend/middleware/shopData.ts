import type { Session, HttpResponseError } from "@shopify/shopify-api";
import type { Express, Request, Response, NextFunction } from "express";
import type { ShopDataResponse } from "../../@types/shop.js";
import shops from "../prisma/database/shops.js";
import shopify from "../shopify.js";

const GET_SHOP_DATA = `{
  shop {
    id
    name
    ianaTimezone
    email
    url
    currencyCode
    primaryDomain {
      url
      sslEnabled
    }
    plan {
      displayName
      partnerDevelopment
      shopifyPlus
    }
    billingAddress {
      name
      company
      city
      country
      phone
    }
  }
}`;

async function updateShopData(app: Express, session: Session) {
  const existingShop = await shops.getShop(session.shop);
  console.log("Get shop data returned:", existingShop);
  const fetchShopData = true;
  // const betaUsers = [""];

  if (!existingShop) {
    console.log(`Event: Install on new shop ${session.shop}`);
    await shops.createShop({
      shop: session.shop,
      scopes: session.scope,
      isInstalled: true,
      installedAt: new Date(),
      uninstalledAt: null,
      installCount: 1,
      showOnboarding: true,
      // notifications: [],
      // settings: { beta: betaUsers.includes(shop) ? true : false },
    });

    // Track install event
    // analytics.track({
    //   event: "install",
    //   userId: shop,
    // });
  } else {
    // We fetch and update shop data on every reauth,
    // uncomment code below if that's not desired
    // if (existingShop.shopData) {
    //   fetchShopData = false;
    // }

    if (!existingShop.isInstalled) {
      // This is a REINSTALL
      console.log(`Event: Reinstall on existing shop ${session.shop}`);
      await shops.updateShop({
        shop: session.shop,
        scopes: session.scope,
        isInstalled: true,
        installedAt: new Date(),
        uninstalledAt: null,
        installCount: existingShop.installCount + 1,
        showOnboarding: true,
        // settings: { beta: betaUsers.includes(shop) ? true : false },
        subscription: {
          update: {
            active: true,
          },
        },
      });

      // Track reinstall event
      // analytics.track({
      //   event: "reinstall",
      //   userId: shop,
      // });
    }
  }

  if (fetchShopData) {
    try {
      const client = new shopify.api.clients.Graphql({ session });

      // Track reauth event
      // analytics.track({
      //   event: "reauth",
      //   userId: session.shop,
      // });

      const res = await client.query<ShopDataResponse>({ data: GET_SHOP_DATA });

      if (!res?.body?.data?.shop) {
        console.warn(`Missing shop data on ${session.shop}`);
      } else {
        const shopData = res.body.data.shop;
        console.log("Got shops data", shopData);

        await shops.updateShop({
          shop: session.shop,
          shopData: {
            connectOrCreate: {
              where: {
                shop: session.shop,
              },
              create: shopData,
            },
          },
        });
      }
    } catch (error) {
      console.log("Failed to fetch shop data:", error);
      console.log("Error Response:", (error as HttpResponseError).response);
    }
  }
}

export default function updateShopDataMiddleware(app: Express) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const { session } = res.locals.shopify;
    // Update db and mark shop as active
    await updateShopData(app, session);
    return next();
  };
}