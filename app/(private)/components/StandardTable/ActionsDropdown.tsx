import { Dropdown } from '@/components/base/dropdown/dropdown';
import Link from 'next/link';
import { FC } from 'react';

export interface StandardTableActionsDropdownItem {
  icon?: FC<{ className?: string }>;
  href: string;
  text: string;
}

export default function StandardTableActionsDropdown({
  items,
}: {
  items: StandardTableActionsDropdownItem[];
}) {
  return (
    <Dropdown.Root>
      <Dropdown.DotsButton />

      <Dropdown.Popover className="w-min">
        <Dropdown.Menu>
          {items.map((item) => (
            <Dropdown.Item key={item.href} icon={item.icon}>
              <span className="pr-4">
                <Link href={item.href}>{item.text}</Link>
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
