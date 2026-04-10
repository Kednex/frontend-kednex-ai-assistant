"use client";

import { useEffect } from "react";
import { useImersianClient } from "@/hooks/useImersianClient";

export function ImersianInitializer() {
  const { configure } = useImersianClient();

  useEffect(() => {
    void configure();
  }, [configure]);

  return null;
}
