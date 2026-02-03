import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
          placeholder="Ex: reddit.com/r/memes"
          className="bg-background border-input text-foreground placeholder:text-muted-foreground flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !inputValue}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </form>
    </div>
  );
};

export default AddRuleForm;
