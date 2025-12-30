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
          className="bg-slate-950 border-slate-700 text-white flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !inputValue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </form>
    </div>
  );
};

export default AddRuleForm;
