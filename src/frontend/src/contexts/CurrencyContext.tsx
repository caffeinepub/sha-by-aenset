import { type ReactNode, createContext, useContext, useState } from "react";

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "SGD", symbol: "S$", label: "SGD (S$)" },
  { code: "AED", symbol: "د.إ", label: "AED (د.إ)" },
  { code: "CAD", symbol: "C$", label: "CAD (C$)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
];

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currencyCode: "USD",
  currencySymbol: "$",
  setCurrency: () => {},
  formatAmount: (n) => `$${n.toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("sha_currency")
      : "USD";
  const [currencyCode, setCurrencyCode] = useState(stored || "USD");

  const setCurrency = (code: string) => {
    setCurrencyCode(code);
    if (typeof window !== "undefined")
      localStorage.setItem("sha_currency", code);
  };

  const currency =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const formatAmount = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount || 0);
    } catch {
      return `${currency.symbol}${(amount || 0).toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currencySymbol: currency.symbol,
        setCurrency,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
