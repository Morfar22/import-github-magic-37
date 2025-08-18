import { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

const fallback = <div className="w-6 h-6 bg-muted animate-pulse rounded" />;

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  // Convert icon name to kebab-case for dynamic imports
  const iconKey = name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '') as keyof typeof dynamicIconImports;
  
  // Check if the icon exists in the dynamic imports
  if (!dynamicIconImports[iconKey]) {
    // Fallback to Users icon if the specified icon doesn't exist
    const LucideIcon = lazy(dynamicIconImports['users']);
    return (
      <Suspense fallback={fallback}>
        <LucideIcon {...props} />
      </Suspense>
    );
  }

  const LucideIcon = lazy(dynamicIconImports[iconKey]);

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

export default DynamicIcon;