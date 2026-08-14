'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cn } from '@/libs/utils/cn';

const DropdownMenu = (props: MenuPrimitive.Root.Props) => <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
const DropdownMenuTrigger = (props: MenuPrimitive.Trigger.Props) => <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
function DropdownMenuContent({ className, children, ...props }: MenuPrimitive.Popup.Props) { return <MenuPrimitive.Portal><MenuPrimitive.Positioner sideOffset={4} className="z-50"><MenuPrimitive.Popup data-slot="dropdown-menu-content" className={cn('min-w-40 rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden', className)} {...props}>{children}</MenuPrimitive.Popup></MenuPrimitive.Positioner></MenuPrimitive.Portal>; }
function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) { return <MenuPrimitive.Item data-slot="dropdown-menu-item" className={cn('flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50', className)} {...props} />; }
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
