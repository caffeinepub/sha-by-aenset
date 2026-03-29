import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "../contexts/CurrencyContext";
import { useI18n } from "../contexts/I18nContext";
import {
  useCreateEntry,
  useDeleteEntry,
  useGetAllEntries,
  useGetSummary,
} from "../hooks/useQueries";

export default function FinanceTab() {
  const { t } = useI18n();
  const { formatAmount } = useCurrency();
  const { data: entries, isLoading } = useGetAllEntries();
  const { data: summary } = useGetSummary();
  const createEntry = useCreateEntry();
  const deleteEntry = useDeleteEntry();

  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const submit = async () => {
    const num = Number.parseFloat(amount);
    if (!num || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!category.trim()) {
      toast.error("Enter a category");
      return;
    }
    await createEntry.mutateAsync({
      amount: num,
      entryType,
      category,
      description,
      date,
    });
    setAmount("");
    setCategory("");
    setDescription("");
    toast.success("Entry added!");
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Summary cards */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-3 text-center"
        >
          <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t.totalIncome}</p>
          <p className="text-sm font-bold text-success">
            {formatAmount(summary?.totalIncome ?? 0)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-3 text-center"
        >
          <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t.totalExpenses}</p>
          <p className="text-sm font-bold text-destructive">
            {formatAmount(summary?.totalExpenses ?? 0)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-3 text-center"
        >
          <DollarSign className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t.balance}</p>
          <p
            className={`text-sm font-bold ${
              (summary?.balance ?? 0) >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {formatAmount(summary?.balance ?? 0)}
          </p>
        </motion.div>
      </div>

      {/* Add Entry Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mt-4 bg-card border border-border rounded-2xl p-4"
      >
        <p className="text-sm font-semibold text-foreground mb-3">
          {t.addEntry}
        </p>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            data-ocid="finance.toggle"
            onClick={() => setEntryType("income")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              entryType === "income"
                ? "bg-success/20 border border-success/40 text-success"
                : "bg-muted text-muted-foreground border border-transparent"
            }`}
          >
            + {t.income}
          </button>
          <button
            type="button"
            data-ocid="finance.toggle"
            onClick={() => setEntryType("expense")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              entryType === "expense"
                ? "bg-destructive/20 border border-destructive/40 text-destructive"
                : "bg-muted text-muted-foreground border border-transparent"
            }`}
          >
            - {t.expense}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <Label className="text-xs">{t.amount}</Label>
            <Input
              data-ocid="finance.input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t.category}</Label>
            <Input
              data-ocid="finance.input"
              placeholder="Food, Rent..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="mb-2">
          <Label className="text-xs">{t.description}</Label>
          <Input
            data-ocid="finance.input"
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="mb-3">
          <Label className="text-xs">{t.date}</Label>
          <Input
            data-ocid="finance.input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          data-ocid="finance.submit_button"
          type="button"
          className="w-full"
          onClick={submit}
          disabled={createEntry.isPending}
        >
          {createEntry.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {t.addEntry}
        </Button>
      </motion.div>

      {/* Entries list */}
      <div className="mx-4 mt-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Recent Entries
        </p>
        {isLoading ? (
          <div data-ocid="finance.loading_state" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-2">
            {[...entries].reverse().map((entry, idx) => (
              <motion.div
                key={entry.id.toString()}
                data-ocid={`finance.item.${idx + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        entry.entryType === "income"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {entry.entryType === "income" ? "+" : "-"}
                      {formatAmount(entry.amount)}
                    </span>
                    <Badge variant="secondary" className="text-xs py-0 px-1.5">
                      {entry.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {entry.description || entry.date}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`finance.delete_button.${idx + 1}`}
                  onClick={() => deleteEntry.mutate(entry.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            data-ocid="finance.empty_state"
            className="bg-card border border-border rounded-xl p-6 text-center"
          >
            <p className="text-muted-foreground text-sm">
              No entries yet. Add your first income or expense.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
