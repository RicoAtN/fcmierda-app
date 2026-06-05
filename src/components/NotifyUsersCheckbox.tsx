'use client';

interface NotifyUsersCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

export default function NotifyUsersCheckbox({ checked, onChange, label }: NotifyUsersCheckboxProps) {
  return (
    <div className="flex items-center p-3 bg-gray-800 border border-gray-600 rounded">
      <input
        type="checkbox"
        id="notifyUsers"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 text-green-600 bg-gray-900 border-gray-600 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
      />
      <label htmlFor="notifyUsers" className="ml-3 text-white cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}