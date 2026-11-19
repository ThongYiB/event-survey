"use client";
import { createContext, useContext } from "react";
import type { CloudManagerData } from "@/lib/cloud-manager";

export const CloudManagerContext = createContext<{
  data: CloudManagerData;
  busy: boolean;
  save: (key: string, value: unknown) => Promise<boolean>;
  select: (id: string) => Promise<boolean>;
} | null>(null);
export const useCloudManager = () => useContext(CloudManagerContext);
