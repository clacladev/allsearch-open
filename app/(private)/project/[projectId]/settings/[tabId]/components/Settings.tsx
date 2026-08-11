'use client';

import { TabList, Tabs } from '@/components/application/tabs/tabs';
import { NativeSelect } from '@/components/base/select/select-native';
import BrandSettings from './BrandSettings';
import OrganizationSettingsForm from '@/components/settings/OrganizationSettingsForm';
import { useRouter } from 'next/navigation';
import { SETTINGS_TABS } from './helpers';
import CompetitorsSettings from './CompetitorsSettings';
import Others from './Others';

export default function Settings({
  projectId,
  selectedSettingsTabId,
}: {
  projectId: string;
  selectedSettingsTabId: string;
}) {
  const router = useRouter();

  const settingsTabs = SETTINGS_TABS;

  const onSelectionChange = (tabId: string) => {
    const tab = settingsTabs.find((tab) => tab.id === tabId);
    if (tab) router.push(tab.getRoute(projectId));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <section>
        <NativeSelect
          aria-label="Settings tabs"
          className="md:hidden"
          value={selectedSettingsTabId}
          onChange={(event) => onSelectionChange(event.target.value)}
          options={settingsTabs.map((group) => ({ label: group.label, value: group.id }))}
        />

        <div className="scrollbar-hide -mx-4 -my-1 flex overflow-auto px-4 py-1 lg:-mx-8 lg:px-8">
          <Tabs
            className="hidden md:flex xl:w-full"
            selectedKey={selectedSettingsTabId}
            onSelectionChange={(value) => onSelectionChange(value as string)}
          >
            <TabList type="button-minimal" className="w-full" items={settingsTabs} />
          </Tabs>
        </div>
      </section>

      {/* Content */}
      <section>
        {selectedSettingsTabId === 'competitors' && <CompetitorsSettings />}
        {selectedSettingsTabId === 'brand' && <BrandSettings />}
        {selectedSettingsTabId === 'organization' && <OrganizationSettingsForm />}
        {selectedSettingsTabId === 'others' && <Others />}
      </section>
    </div>
  );
}
