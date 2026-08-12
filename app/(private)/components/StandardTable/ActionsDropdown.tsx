import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FC } from 'react';
export interface StandardTableActionsDropdownItem { icon?: FC<{ className?: string }>; href: string; text: string; }
export default function StandardTableActionsDropdown({ items }: { items: StandardTableActionsDropdownItem[] }) { return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Row actions"><MoreHorizontal aria-hidden="true" /></Button>} /><DropdownMenuContent aria-label="Row actions">{items.map(({ icon: Icon, href, text }) => <DropdownMenuItem key={href} render={<Link href={href} />}>{Icon && <Icon aria-hidden="true" />}{text}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>; }
