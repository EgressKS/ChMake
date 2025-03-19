import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: string;
    isRead?: boolean;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar = true, 
  showTimestamp = true 
}: MessageBubbleProps) {
  return (
    <div className={cn(
      "group flex gap-3 transition-all duration-200 hover:bg-muted/30",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && !isOwn && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold text-primary">
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground px-2">
            {message.sender.name}
          </span>
        )}
        
        <div className={cn(
          "relative rounded-2xl px-4 py-2 shadow-sm transition-all duration-200",
          "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:opacity-10",
          isOwn 
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground before:from-primary/20 before:to-primary/10" 
            : "bg-gradient-to-br from-muted to-muted/80 text-foreground before:from-muted/20 before:to-muted/10"
        )}>
          <p className="relative text-sm leading-relaxed">{message.content}</p>
          
          {isOwn && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
              {message.isRead ? (
                <div className="h-2 w-2 rounded-full bg-primary-foreground/60" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
              )}
            </div>
          )}
        </div>
        
        {showTimestamp && (
          <span className="text-xs text-muted-foreground px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
      
      {showAvatar && isOwn && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-sm font-semibold text-accent-foreground">
            You
          </div>
        </div>
      )}
    </div>
  );
}
