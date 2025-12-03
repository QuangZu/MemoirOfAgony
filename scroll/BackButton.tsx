import { ArrowLeft } from "lucide-react";
import { cn } from "./lib/utils";

interface BackButtonProps {
  onClick: () => void;
  visible: boolean;
}

export const BackButton = ({ onClick, visible }: BackButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "back-button",
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </button>
  );
};
