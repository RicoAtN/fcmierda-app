'use client';

interface NotifyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function NotifyCheckbox({ checked, onChange, label = "Notify users about this match update" }: NotifyCheckboxProps) {
  return (
    <div className="flex items-center p-3 bg-gray-800 border border-gray-600 rounded mt-4">
      <input
        type="checkbox"
        id="notifyUsers"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
      />
      <label htmlFor="notifyUsers" className="ml-3 text-white cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}
