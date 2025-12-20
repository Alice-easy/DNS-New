// Geo routing types
export type RecordType = "A" | "AAAA" | "CNAME";
export type LoadBalancing = "round_robin" | "weighted" | "failover";

// Region codes
export const REGIONS = {
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  SA: "South America",
  AF: "Africa",
  OC: "Oceania",
} as const;

// Common country codes
export const COUNTRIES = {
  CN: "China",
  US: "United States",
  JP: "Japan",
  KR: "South Korea",
  DE: "Germany",
  FR: "France",
  GB: "United Kingdom",
  AU: "Australia",
  BR: "Brazil",
  IN: "India",
  RU: "Russia",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
} as const;
