import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: string;
}

export function Checkbox({ className, label, description, checked, onChange, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className={`
          w-5 h-5 rounded border border-input bg-background 
          peer-focus:ring-2 peer-focus:ring-ring peer-focus:border-primary
          peer-checked:bg-primary peer-checked:border-primary
          transition-all duration-200 ease-in-out
          flex items-center justify-center
        `}>
          <Check className={`h-3.5 w-3.5 text-primary-foreground transition-transform duration-200 ${checked ? 'scale-100' : 'scale-0'}`} />
        </div>
      </div>
      
      {(label || description) && (
        <div className="flex flex-col select-none">
          {label && <span className="font-medium text-foreground group-hover:text-foreground/80 transition-colors">{label}</span>}
          {description && <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">{description}</span>}
        </div>
      )}
    </label>
  )
}
