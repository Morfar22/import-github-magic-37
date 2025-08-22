import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, User, Clock, Send, Ban, Shield } from "lucide-react";

interface ChatSession {
  id: string;
  visitor_name: string;
  visitor_email?: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  user_id?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  sender_id?: string;
}

interface AgentProfile {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}

interface VisitorProfile {
  id?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  discord_username?: string;
  created_at?: string;
}

const LiveChatSupport = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentProfile | null>(null);
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    subscribeToSessions();
    loadCurrentAgent();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages();
      subscribeToMessages();
      loadVisitorProfile();
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentAgent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, email')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentAgent(profile);
    } catch (error) {
      console.error('Error loading agent profile:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadVisitorProfile = async () => {
    if (!selectedSession) return;

    try {
      if (selectedSession.user_id) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url, discord_username, created_at')
          .eq('id', selectedSession.user_id)
          .single();

        if (error) throw error;
        setVisitorProfile(profile);
      } else {
        // For non-authenticated visitors, create a basic profile
        setVisitorProfile({
          email: selectedSession.visitor_email,
          username: selectedSession.visitor_name,
        });
      }
    } catch (error) {
      console.error('Error loading visitor profile:', error);
      setVisitorProfile(null);
    }
  };

  const loadMessages = async () => {
    if (!selectedSession) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToSessions = () => {
    const channel = supabase
      .channel('chat_sessions_staff')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = () => {
    if (!selectedSession) return;

    console.log('LiveChatSupport: Setting up message subscription for session:', selectedSession.id);

    const channel = supabase
      .channel(`messages_${selectedSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSession.id}`
        },
        (payload) => {
          console.log('LiveChatSupport: Received new message via real-time:', payload);
          setMessages(prev => {
            console.log('LiveChatSupport: Adding message to state. Previous count:', prev.length);
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('LiveChatSupport: Subscription status:', status);
      });

    return () => {
      console.log('LiveChatSupport: Cleaning up message subscription');
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const assignToSelf = async (session: ChatSession) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'active',
          assigned_to: user.id
        })
        .eq('id', session.id);

      if (error) throw error;

      setSelectedSession({ ...session, status: 'active', assigned_to: user.id });
      
      // Log to Discord
      try {
        await supabase.functions.invoke('discord-chat-logger', {
          body: {
            type: 'chat_assigned',
            sessionId: session.id,
            visitorName: session.visitor_name,
            visitorEmail: session.visitor_email,
            staffName: currentAgent?.username || 'Unknown Staff'
          }
        });
      } catch (discordError) {
        console.warn('Failed to log to Discord:', discordError);
      }
      
      toast({
        title: "Chat Assigned",
        description: `You are now handling the chat with ${session.visitor_name}`,
      });
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast({
        title: "Error",
        description: "Failed to assign chat",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    console.log('LiveChatSupport: Sending message:', {
      session_id: selectedSession.id,
      message: newMessage,
      sender_type: 'staff'
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          message: newMessage,
          sender_type: 'staff',
          sender_id: user.id
        })
        .select();

      if (error) {
        console.error('LiveChatSupport: Insert error:', error);
        throw error;
      }

      console.log('LiveChatSupport: Message sent successfully:', data);
      setNewMessage("");
    } catch (error) {
      console.error('LiveChatSupport: Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const banUser = async () => {
    if (!selectedSession) {
      console.log('No selected session for ban');
      return;
    }

    console.log('Starting ban process for session:', selectedSession);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('Current user:', user.id);

      // Get user's IP address (best effort)
      let userIP = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
        console.log('Captured IP address:', userIP);
      } catch (ipError) {
        console.warn('Could not get IP address:', ipError);
      }

      console.log('Attempting to ban user:', {
        user_id: selectedSession.user_id,
        visitor_email: selectedSession.visitor_email,
        visitor_name: selectedSession.visitor_name,
        banned_by: user.id,
        ip_address: userIP
      });

      // Insert ban record with IP address
      const { error: banError } = await supabase
        .from('chat_banned_users')
        .insert({
          user_id: selectedSession.user_id,
          visitor_email: selectedSession.visitor_email,
          visitor_name: selectedSession.visitor_name,
          banned_by: user.id,
          ip_address: userIP,
          reason: 'Banned from live chat'
        });

      if (banError) {
        console.error('Ban insert error:', banError);
        throw banError;
      }

      console.log('Ban record inserted successfully');

      // End the chat session
      const { error: endError } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (endError) {
        console.error('Session end error:', endError);
        throw endError;
      }

      console.log('Chat session ended successfully');

      // Log ban to Discord
      try {
        await supabase.functions.invoke('discord-chat-logger', {
          body: {
            type: 'user_banned',
            sessionId: selectedSession.id,
            visitorName: selectedSession.visitor_name,
            visitorEmail: selectedSession.visitor_email,
            staffName: currentAgent?.username || 'Unknown Staff',
            banReason: 'Banned from live chat',
            ipAddress: userIP
          }
        });
      } catch (discordError) {
        console.warn('Failed to log ban to Discord:', discordError);
      }

      setSelectedSession(null);
      setMessages([]);
      setVisitorProfile(null);
      
      toast({
        title: "User Banned",
        description: `${selectedSession.visitor_name} has been banned from live chat (Email${userIP ? ' and IP' : ''})`,
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: `Failed to ban user: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const endChat = async () => {
    if (!selectedSession) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (error) throw error;

      // Log chat end to Discord
      try {
        await supabase.functions.invoke('discord-chat-logger', {
          body: {
            type: 'chat_ended',
            sessionId: selectedSession.id,
            visitorName: selectedSession.visitor_name,
            visitorEmail: selectedSession.visitor_email
          }
        });
      } catch (discordError) {
        console.warn('Failed to log chat end to Discord:', discordError);
      }

      setSelectedSession(null);
      setMessages([]);
      setVisitorProfile(null);
      
      toast({
        title: "Chat Ended",
        description: "Chat session has been closed",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Agent Info Header */}
      {currentAgent && (
        <Card className="bg-gaming-darker border-gaming-border">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentAgent.avatar_url || undefined} />
                <AvatarFallback className="bg-neon-teal text-white">
                  <Shield className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground flex items-center space-x-2">
                  <span>Agent: {currentAgent.username}</span>
                  <Badge variant="default" className="bg-neon-teal">Online</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">{currentAgent.email}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Sessions List */}
        <Card className="bg-gaming-darker border-gaming-border">
          <div className="p-4 border-b border-gaming-border">
            <h3 className="font-semibold text-foreground">Active Chats</h3>
          </div>
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active chats</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-neon-teal/20 border-neon-teal'
                      : 'bg-gaming-dark border-gaming-border hover:bg-gaming-dark/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-neon-teal" />
                      <span className="font-medium text-foreground">{session.visitor_name}</span>
                    </div>
                    <Badge variant={session.status === 'waiting' ? 'secondary' : 'default'}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(session.created_at)}</span>
                  </div>
                  {session.status === 'waiting' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToSelf(session);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="mt-2 w-full bg-neon-teal hover:bg-neon-teal/80"
                    >
                      Take Chat
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <Card className="bg-gaming-darker border-gaming-border h-full flex flex-col">
              {/* Chat Header with Visitor Info */}
              <div className="p-4 border-b border-gaming-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={visitorProfile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gaming-dark text-foreground">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {selectedSession.visitor_name}
                      </h3>
                      {selectedSession.visitor_email && (
                        <p className="text-sm text-muted-foreground">{selectedSession.visitor_email}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={selectedSession.status === 'active' ? 'default' : 'secondary'}>
                          {selectedSession.status}
                        </Badge>
                        {visitorProfile?.discord_username && (
                          <Badge variant="outline" className="text-xs">
                            Discord: {visitorProfile.discord_username}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={banUser}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Ban User
                    </Button>
                    <Button
                      onClick={endChat}
                      variant="outline"
                      size="sm"
                    >
                      End Chat
                    </Button>
                  </div>
                </div>
                
                {/* Visitor Details */}
                {visitorProfile && (
                  <div className="bg-gaming-dark rounded-lg p-3 text-sm">
                    <h4 className="font-medium text-foreground mb-2">Visitor Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      {visitorProfile.username && (
                        <div><span className="font-medium">Username:</span> {visitorProfile.username}</div>
                      )}
                      {visitorProfile.email && (
                        <div><span className="font-medium">Email:</span> {visitorProfile.email}</div>
                      )}
                      {visitorProfile.created_at && (
                        <div><span className="font-medium">Member since:</span> {new Date(visitorProfile.created_at).toLocaleDateString()}</div>
                      )}
                      <div><span className="font-medium">Session started:</span> {new Date(selectedSession.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_type === 'staff'
                          ? 'bg-neon-teal text-white'
                          : 'bg-gaming-dark border border-gaming-border text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gaming-border">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 min-h-[60px] bg-gaming-dark border-gaming-border resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-neon-teal hover:bg-neon-teal/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gaming-darker border-gaming-border h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a chat to start responding</p>
              <p className="text-sm">Choose from the active chats on the left</p>
            </div>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatSupport;