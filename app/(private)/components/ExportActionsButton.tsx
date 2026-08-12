'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
export function ExportActionsButton({ onExportCsvAction }: { onExportCsvAction?: () => void }) { return <DropdownMenu><DropdownMenuTrigger render={<Button variant="secondary" size="sm"><Download aria-hidden="true" />Export</Button>} /><DropdownMenuContent aria-label="Export actions"><DropdownMenuItem onClick={onExportCsvAction}><FileSpreadsheet aria-hidden="true" />Export as CSV</DropdownMenuItem></DropdownMenuContent></DropdownMenu>; }
