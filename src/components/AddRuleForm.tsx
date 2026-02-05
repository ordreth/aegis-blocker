import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { t } from "@/lib/i18n";

interface AddRuleFormProps {
  isOptionsPage: boolean;
  inputValue: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddRuleForm = ({
  isOptionsPage,
  inputValue,
  isLoading,
  onInputChange,
  onSubmit,
}: AddRuleFormProps) => {
  return (
    <div className={`flex gap-4 ${isOptionsPage ? "mb-8 max-w-xl" : ""}`}>
      <form onSubmit={onSubmit} className="flex gap-2 w-full">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t("input_placeholder_example")}
          className="bg-background border-input text-foreground placeholder:text-muted-foreground flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !inputValue}
          className="bg-primary hover:bg-primary/90 font-bold text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("btn_add")}
        </Button>
      </form>
    </div>
  );
};

export default AddRuleForm;
