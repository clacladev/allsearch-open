type PlaceholderIllustrationProps = {
  label?: string;
};

export const PlaceholderIllustration = ({ label = 'Illustration' }: PlaceholderIllustrationProps) => (
  <div
    className="bg-secondary ring-secondary flex min-h-64 w-full items-center justify-center rounded-2xl ring-1"
    aria-hidden="true"
  >
    <span className="text-tertiary text-sm font-medium">{label}</span>
  </div>
);
