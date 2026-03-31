"use client";

import { useCallback, useEffect, useState } from "react";

type ImersianConfig = {
  userUuid: string;
  designId: string;
  viewerUrl: string;
  type?: string;
  lang?: string;
};

type ImersianClient = {
  configSettings: (config: ImersianConfig) => void;
  showImersianVisualiser: (currentSKU?: string) => void;
  bindVisualiserMessageHandlers?: () => void;
  unbindVisualiserMessageHandlers?: () => void;
  closeImersianView?: () => void;
};

declare global {
  interface Window {
    ImersianWebClient?:
      | ImersianClient
      | {
          default?: ImersianClient;
        };
  }
}

let cachedClient: ImersianClient | null = null;
let loadPromise: Promise<ImersianClient | null> | null = null;
let scriptPromise: Promise<void> | null = null;

const IMERSIAN_SCRIPT_SRC = "/lib/bundled.js";
// const IMERSIAN_SCRIPT_SRC = "/lib/imersian-client.js";

function resolveWindowClient(): ImersianClient | null {
  if (typeof window === "undefined" || !window.ImersianWebClient) {
    return null;
  }

  const globalClient = window.ImersianWebClient as
    | ImersianClient
    | {
        default?: ImersianClient;
      };

  if (typeof (globalClient as ImersianClient).configSettings === "function") {
    return globalClient as ImersianClient;
  }

  if ("default" in globalClient && globalClient.default && typeof globalClient.default.configSettings === "function") {
    return globalClient.default;
  }

  return null;
}

function bindClientToWindow(client: ImersianClient | null) {
  if (typeof window === "undefined" || !client) {
    return;
  }

  // The bundled library iframe uses a string callback: ImersianWebClient.visualiserLoaded().
  // This must point to the class object itself, not the UMD wrapper object.
  window.ImersianWebClient = client;

  if (typeof client.bindVisualiserMessageHandlers === "function") {
    client.bindVisualiserMessageHandlers();
  }
}

function getUserUuidFromQuery(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userUuid = new URLSearchParams(window.location.search).get("userUuid");
  return userUuid && userUuid.trim().length > 0 ? userUuid : null;
}

//get designId from query params to pass to visualiser
function getDesignIdFromQuery(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const designId = new URLSearchParams(window.location.search).get("designId");
  return designId && designId.trim().length > 0 ? designId : null;
}

function normalizeVisualiserSku(sku?: string): string | undefined {
  if (!sku) {
    return undefined;
  }

  const trimmed = sku.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  // Shopify GIDs are not visualizer-compatible; use the terminal ID segment.
  if (trimmed.startsWith("gid://")) {
    const segments = trimmed.split("/");
    return segments[segments.length - 1] || undefined;
  }

  return trimmed;
}

async function loadClient(): Promise<ImersianClient | null> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      if (typeof window === "undefined") {
        return null;
      }

      const existingClient = resolveWindowClient();
      if (existingClient) {
        bindClientToWindow(existingClient);
        cachedClient = existingClient;
        return existingClient;
      }

      if (!scriptPromise) {
        scriptPromise = new Promise<void>((resolve, reject) => {
          const existingScript = document.querySelector(`script[src="${IMERSIAN_SCRIPT_SRC}"]`);
          if (existingScript) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.src = IMERSIAN_SCRIPT_SRC;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Imersian script."));
          document.body.appendChild(script);
        });
      }

      await scriptPromise;
      const loadedClient = resolveWindowClient();
      bindClientToWindow(loadedClient);
      cachedClient = loadedClient;
      return loadedClient;
    })().catch(() => null);
  }

  return loadPromise;
}

export function useImersianClient() {
  const [isReady, setIsReady] = useState<boolean>(Boolean(cachedClient));

  useEffect(() => {
    let active = true;

    loadClient().then((client) => {
      if (!active) {
        return;
      }
      setIsReady(Boolean(client));
    });

    return () => {
      active = false;
    };
  }, []);

  const configure = useCallback(async (config?: Partial<ImersianConfig>) => {
    const client = await loadClient();
    if (!client) {
      return { ok: false, message: "Imersian library failed to load." };
    }

    const userUuid = config?.userUuid || getUserUuidFromQuery();
    if (!userUuid) {
      return { ok: false, message: "Missing userUuid in URL query." };
    }
    const designId = config?.designId || getDesignIdFromQuery();
    console.log(`[useImersianClient] Configuring Imersian client with userUuid=${userUuid} and designId=${designId}`);
    
    if (!designId) {
      return { ok: false, message: "Missing designId in URL query." };
    }

    client.configSettings({
      userUuid,
      designId,
      viewerUrl: config?.viewerUrl || process.env.NEXT_PUBLIC_IMERSIAN_VIEWER_URL || "viewer.imersian.com",
      type: config?.type || "shopify",
      lang: config?.lang || "en",
    });

    setIsReady(true);
    return { ok: true, message: "Imersian configured." };
  }, []);

  const openVisualiser = useCallback(
    async (sku?: string, config?: Partial<ImersianConfig>) => {
      const configured = await configure(config);
      if (!configured.ok) {
        return configured;
      }

      const formattedSku = normalizeVisualiserSku(sku);
      console.log(`[useImersianClient] Opening visualiser with SKU=${formattedSku} (raw: ${sku})`); //see the log to verify SKU formatting
      if (!formattedSku) {
        return { ok: false, message: "Missing sku for Imersian visualiser." };
      }

      const client = await loadClient();
      if (!client) {
        return { ok: false, message: "Imersian library is unavailable." };
      }

      try {
        // client.showImersianVisualiser(formattedSku);
        client.showImersianVisualiser(sku);
        return { ok: true, message: "Imersian visualiser opened." };
      } catch {
        return { ok: false, message: "Failed to open Imersian visualiser." };
      }
    },
    [configure],
  );

  return {
    isReady,
    configure,
    openVisualiser,
  };
}
