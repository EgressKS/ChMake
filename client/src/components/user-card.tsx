import { cn } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    languages?: Array<{ code: string; level: string }>;
    bio?: string;
  };
  variant?: 'default' | 'compact' | 'detailed';
  showStatus?: boolean;
  showLanguages?: boolean;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function UserCard({ 
  user, 
  variant = 'default', 
  showStatus = true, 
  showLanguages = false,
  actions,
  onClick,
  className 
}: UserCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-card-border/50",
          "hover:bg-card/80 hover:border-card-border transition-all duration-200",
          "hover:shadow-md cursor-pointer group",
          className
        )}
        onClick={onClick}
      >
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {showStatus && user.status && (
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              statusColors[user.status]
            )} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {user.name}
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {actions}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div 
        className={cn(
          "p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-card-border/50",
          "hover:from-card to-card/60 hover:border-card-border hover:shadow-lg transition-all duration-300",
          "cursor-pointer group",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {showStatus && user.status && (
              <div className={cn(
                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                statusColors[user.status]
              )} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {user.name}
            </h3>
            {user.email && (
              <p className="text-sm text-muted-foreground mb-2">
                {user.email}
              </p>
            )}
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {user.bio}
              </p>
            )}
            
            {showLanguages && user.languages && user.languages.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {user.languages.slice(0, 3).map((lang, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {lang.code.toUpperCase()} • {lang.level}
                  </span>
                ))}
                {user.languages.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    +{user.languages.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {actions}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={cn(
        "p-4 rounded-xl bg-card/50 border border-card-border/50",
        "hover:bg-card/80 hover:border-card-border hover:shadow-md transition-all duration-200",
        "cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg font-semibold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {showStatus && user.status && (
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              statusColors[user.status]
            )} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium group-hover:text-primary transition-colors">
            {user.name}
          </p>
          {user.email && (
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
