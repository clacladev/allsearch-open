export default function SettingsFormHeader({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 md:gap-3">
      {title && (
        <h1 className="text-display-xs text-primary md:text-display-md font-semibold">{title}</h1>
      )}
      {description && <p className="text-md text-tertiary">{description}</p>}
    </div>
  );
}
