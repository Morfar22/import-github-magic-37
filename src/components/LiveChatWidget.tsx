import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, X, Send, Minimize2, Maximize2 } from "lucide-react";

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'staff' | 'visitor';
  created_at: string;
  sender_id?: string;
}

interface ChatSession {
  id: string;
  status: string;
  assigned_to?: string;
  user_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  created_at?: string;
  updated_at?: string;
  ended_at?: string;
}

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkChatSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session) {
      loadExistingMessages();
      subscribeToMessages();
      subscribeToSessionUpdates();
    }
  }, [session]);

  const checkChatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_settings')
        .single();

      if (error) throw error;

      const settings = data?.setting_value as any;
      setChatEnabled(settings?.enabled || false);
    } catch (error) {
      console.error('Error checking chat settings:', error);
    }
  };

  const loadExistingMessages = async () => {
    if (!session) return;

    console.log('LiveChatWidget: Loading existing messages for session:', session.id);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('LiveChatWidget: Loaded existing messages:', data);
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('LiveChatWidget: Error loading existing messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!session) return;

    console.log('LiveChatWidget: Setting up message subscription for session:', session.id);

    const channel = supabase
      .channel(`chat_messages_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('LiveChatWidget: Received new message via real-time:', payload);
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            console.log('LiveChatWidget: Adding message to state. Previous count:', prev.length);
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('LiveChatWidget: Subscription status:', status);
      });

    return () => {
      console.log('LiveChatWidget: Cleaning up message subscription');
      supabase.removeChannel(channel);
    };
  };

  const subscribeToSessionUpdates = () => {
    if (!session) return;

    const channel = supabase
      .channel(`chat_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession;
          setSession(updatedSession);
          
          if (updatedSession.status === 'active' && session.status === 'waiting') {
            toast({
              title: "Chat Connected",
              description: "A staff member has joined the chat",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startChat = async () => {
    if (!visitorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to start the chat",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get user's IP address (best effort)
      let userIP = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (ipError) {
        console.warn('Could not get IP address:', ipError);
      }

      // Check if user is banned by email or IP
      const banChecks = [];
      
      if (visitorEmail) {
        banChecks.push(
          supabase
            .from('chat_banned_users')
            .select('id, reason')
            .eq('visitor_email', visitorEmail)
            .limit(1)
        );
      }

      if (userIP) {
        banChecks.push(
          supabase
            .from('chat_banned_users')
            .select('id, reason')
            .eq('ip_address', userIP)
            .limit(1)
        );
      }

      if (banChecks.length > 0) {
        const banResults = await Promise.all(banChecks);
        
        for (const result of banResults) {
          if (result.error) throw result.error;
          
          if (result.data && result.data.length > 0) {
            toast({
              title: "Access Denied",
              description: "You are currently banned from using live chat",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // Attach authenticated user if available
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          visitor_name: visitorName,
          visitor_email: visitorEmail || null,
          status: 'waiting',
          user_id: userId
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
      setHasStartedChat(true);

      // Log chat start to Discord
      try {
        await supabase.functions.invoke('discord-chat-logger', {
          body: {
            type: 'chat_started',
            sessionId: sessionData.id,
            visitorName: visitorName,
            visitorEmail: visitorEmail
          }
        });
      } catch (discordError) {
        console.warn('Failed to log chat start to Discord:', discordError);
      }

      toast({
        title: "Chat Started",
        description: "Waiting for a staff member to join...",
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    console.log('LiveChatWidget: Sending message:', {
      session_id: session.id,
      message: newMessage,
      sender_type: 'visitor'
    });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          message: newMessage,
          sender_type: 'visitor'
        })
        .select();

      if (error) {
        console.error('LiveChatWidget: Insert error:', error);
        throw error;
      }

      console.log('LiveChatWidget: Message sent successfully:', data);
      setNewMessage("");
    } catch (error) {
      console.error('LiveChatWidget: Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = async () => {
    if (!session) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id);

      setSession(null);
      setMessages([]);
      setHasStartedChat(false);
      setIsOpen(false);
      
      toast({
        title: "Chat Ended",
        description: "Thank you for using our support chat",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  if (!chatEnabled) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className={`fixed bottom-6 right-6 bg-gaming-card border-gaming-border shadow-xl z-50 transition-all duration-300 ${
          isMinimized ? 'h-16 w-80' : 'h-96 w-80'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gaming-border">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-neon-teal" />
              <span className="font-semibold text-foreground">Live Support</span>
              {session && (
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                variant="ghost"
                size="sm"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col h-80">
              {!hasStartedChat ? (
                /* Start Chat Form */
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Your name"
                      className="bg-gaming-dark border-gaming-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email (optional)</label>
                    <Input
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-gaming-dark border-gaming-border"
                    />
                  </div>
                  <Button
                    onClick={startChat}
                    disabled={isLoading}
                    className="w-full bg-neon-teal hover:bg-neon-teal/80"
                  >
                    {isLoading ? 'Starting...' : 'Start Chat'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.length === 0 && session?.status === 'waiting' && (
                      <div className="text-center text-muted-foreground text-sm">
                        Waiting for a staff member to join...
                      </div>
                    )}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            message.sender_type === 'visitor'
                              ? 'bg-neon-teal text-white'
                              : 'bg-gaming-dark border border-gaming-border text-foreground'
                          }`}
                        >
                          {message.message}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gaming-border">
                    <div className="flex space-x-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[40px] max-h-[80px] bg-gaming-dark border-gaming-border resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !session}
                        size="sm"
                        className="bg-neon-teal hover:bg-neon-teal/80"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {session && (
                      <Button
                        onClick={endChat}
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-destructive hover:text-destructive/80"
                      >
                        End Chat
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default LiveChatWidget;