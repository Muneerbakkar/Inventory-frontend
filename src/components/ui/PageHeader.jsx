export function PageHeader({ title, description, icon: Icon, breadcrumb, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
      <div>
        {breadcrumb && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          )}
          {title}
        </h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {children && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">{children}</div>}
    </div>
  );
}
