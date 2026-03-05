import { useEffect, useState } from "react";
import { Save } from "lucide-react";

interface FormAutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date;
}

const FormAutoSaveIndicator = ({ isSaving, lastSaved }: FormAutoSaveIndicatorProps) => {
  const [visible, setVisible] = useState(false);

  // Show indicator when saving starts
  useEffect(() => {
    if (isSaving) {
      setVisible(true);
    }
  }, [isSaving]);

  // Hide indicator after 2 seconds of no saving
  useEffect(() => {
    if (!isSaving && visible) {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, visible]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
      <Save className={`h-3 w-3 ${isSaving ? 'animate-pulse' : ''}`} />
      <span>{isSaving ? "Saving..." : "Draft saved"}</span>
    </div>
  );
};

export default FormAutoSaveIndicator;
