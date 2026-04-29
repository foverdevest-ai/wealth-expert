export type EntityType = "PRIVATE" | "HOLDING_BV" | "OPERATING_BV" | "UK_LTD" | "OTHER";
export type AccountSourceType = "ABN_AMRO" | "BITVAVO" | "REVOLUT" | "DEGIRO" | "MANUAL";
export type AccountClass = "BANK" | "CRYPTO" | "BROKER" | "PROPERTY" | "LIABILITY" | "MANUAL";
export type LiquidityClass = "LIQUID" | "ILLIQUID" | "MIXED";
export type TransactionDirection = "INFLOW" | "OUTFLOW";
export type InvestmentProvider = "BITVAVO" | "DEGIRO";

export type Entity = {
  id: string;
  name: string;
  type: EntityType;
};

export type Account = {
  id: string;
  name: string;
  entityId: string;
  source: AccountSourceType;
  class: AccountClass;
  liquidity: LiquidityClass;
  balance: number;
  lastUpdated: string;
  syncStatus: "HEALTHY" | "STALE" | "ERROR" | "MANUAL";
  includeInConsolidated: boolean;
};

export type Category = {
  id: string;
  name: string;
  parentId?: string;
  color: string;
  isSystem?: boolean;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  accountId: string;
  entityId: string;
  categoryId: string;
  amount: number;
  direction: TransactionDirection;
  isInternalTransfer: boolean;
  isInvestmentRelated: boolean;
  liquidityImpact: LiquidityClass;
  counterparty?: string;
  notes?: string;
  tags: string[];
};

export type AssetSnapshot = {
  id: string;
  month: string;
  accountId: string;
  entityId: string;
  assetClass: AccountClass;
  liquidity: LiquidityClass;
  value: number;
};

export type LiabilitySnapshot = {
  id: string;
  month: string;
  name: string;
  entityId: string;
  liquidity: LiquidityClass;
  value: number;
};

export type InvestmentSnapshot = {
  id: string;
  month: string;
  accountId: string;
  provider: InvestmentProvider;
  assetType: "CRYPTO" | "ETF" | "STOCK" | "CASH";
  contributed: number;
  currentValue: number;
  realizedGainLoss: number;
};

export type ProviderConnection = {
  id: string;
  provider: AccountSourceType;
  displayName: string;
  status: "CONNECTED" | "RECONNECT_REQUIRED" | "ERROR" | "MANUAL_ONLY";
  lastSync: string;
  syncHealth: string;
};
