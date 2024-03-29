import type { Session } from "@shopify/shopify-api";
import { AuthScopes } from "@shopify/shopify-api/lib/auth/scopes/index.js";
import prisma, { tryCatch } from "./client.js";

export default {
  storeCallback,
  loadCallback,
  deleteCallback,
  findSessions,
  deleteSession,
  deleteSessions,
};

const isActiveFn: (scopes: string | string[] | AuthScopes) => boolean =
  function (scopes) {
    // @ts-ignore
    const scopesUnchanged = scopes.equals(this.scope);
    if (
      scopesUnchanged &&
      // @ts-ignore
      this.accessToken &&
      // @ts-ignore
      (!this.expires || this.expires >= new Date())
    ) {
      return true;
    }
    return false;
  };

async function storeCallback(session: Session) {
  console.log("storeCallback called with session:", session);
  console.log("session.isActive:", session.isActive);

  const { error } = await tryCatch(async () => {
    return await prisma.session.upsert({
      where: {
        id: session.id,
      },
      update: {
        id: session.id,
        session: JSON.stringify(session),
        shop: session.shop,
      },
      create: {
        id: session.id,
        session: JSON.stringify(session),
        shop: session.shop,
      },
    });
  });
  if (error) return false;
  return true;
}

async function loadCallback(id: string) {
  // console.log("loadCallback called with id:", id);
  const { data, error } = await tryCatch(async () => {
    return await prisma.session.findFirst({
      where: {
        id,
      },
    });
  });
  if (!error) {
    if (!data) return undefined;
    const session = JSON.parse(data.session) as Session;
    //////////////////////////////////////////////////////////////////////////////
    // Workaround until https://github.com/Shopify/shopify-api-js/issues/573 is fixed
    session.isActive = isActiveFn;
    //////////////////////////////////////////////////////////////////////////////
    return session;
  }
  return undefined;
}

async function deleteCallback(id: string) {
  console.log("deleteCallback called with id:", id);
  const { error } = await tryCatch(async () => {
    return await prisma.session.delete({
      where: {
        id,
      },
    });
  });
  if (error) return false;
  return true;
}

async function findSessions(shop: string) {
  console.log("findSessions called with shop:", shop);
  const { data, error } = await tryCatch(async () => {
    return await prisma.session.findMany({
      where: {
        shop,
      },
    });
  });
  if (!error) {
    if (!data) return [];
    return data.map((d) => JSON.parse(d.session) as Session);
  }
  return [];
}

async function deleteSession(shop: string) {
  console.log("deleteSession called with shop", shop);
  const { error } = await tryCatch(async () => {
    return await prisma.session.deleteMany({
      where: {
        shop,
      },
    });
  });
  if (error) return false;
  return true;
}

async function deleteSessions(ids: string[]) {
  console.log("deleteSessions called with ids:", ids);
  for (const id of ids) {
    console.log("deleting session with id:", id);
    const { error } = await tryCatch(async () => {
      return await prisma.session.delete({
        where: {
          id,
        },
      });
    });
    if (error) return false;
  }
  return true;
}
