// src/components/TwitchStreamersManager.tsx
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Users, ExternalLink, GripVertical } from "lucide-react";
import StreamerCard from "@/components/StreamerCard";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// INTERFACES
interface TwitchStreamer {
  id: string;
  username: string;
  twitch_username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

type StreamDataMap = Record<string, any>;

// DRAG HANDLE
function DragHandle() {
  return (
    <span className="cursor-grab px-2">
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </span>
  );
}

// SORTABLE ROW
function SortableStreamerRow({ streamer, onEdit, onDelete, toggleActive }: { 
  streamer: TwitchStreamer; 
  onEdit: (streamer: TwitchStreamer) => void;
  onDelete: (id: string) => void;
  toggleActive: (id: string, active: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: streamer.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-gaming-dark rounded-lg border border-gaming-border mb-2"
    >
      <span {...attributes} {...listeners} className="cursor-grab px-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </span>
      {streamer.avatar_url ? (
        <img
          src={streamer.avatar_url}
          alt={streamer.display_name || streamer.username}
          className="w-10 h-10 rounded-full mx-2"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center mx-2">
          <Users className="h-5 w-5 text-neon-purple" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-foreground">
          {streamer.display_name || streamer.username}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>@{streamer.twitch_username}</span>
          <a
            href={`https://twitch.tv/${streamer.twitch_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-neon-purple hover:text-neon-purple/80"
          >
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
      <Badge variant={streamer.is_active ? "default" : "secondary"}>
        {streamer.is_active ? "Active" : "Inactive"}
      </Badge>
      <div className="flex items-center space-x-2 ml-auto">
        <Switch
          checked={streamer.is_active}
          onCheckedChange={(checked) => toggleActive(streamer.id, checked)}
        />
        <Button variant="outline" size="sm" onClick={() => onEdit(streamer)}>
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gaming-card border-gaming-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Streamer</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete "{streamer.display_name || streamer.username}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(streamer.id)} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const TwitchStreamersManager = () => {
  const [streamers, setStreamers] = useState<TwitchStreamer[]>([]);
  const [streamData, setStreamData] = useState<StreamDataMap>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStreamer, setEditingStreamer] = useState<TwitchStreamer | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    twitch_username: '',
    display_name: '',
    avatar_url: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamers();
    fetchStreamData();
    // eslint-disable-next-line
  }, []);

  // DRAG-DROP
  const sensors = useSensors(useSensor(PointerSensor));

  // FETCH STREAMERS
  const fetchStreamers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('twitch_streamers')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setStreamers(data || []);
    } catch (error) {
      console.error('Error fetching streamers:', error);
      toast({ title: "Error", description: "Failed to fetch streamers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // FETCH LIVE DATA
  const fetchStreamData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitch-streams');
      
      if (error) {
        console.error('Error calling fetch-twitch-streams:', error);
        throw error;
      }
      
      if (data) {
        setStreamData(data.streamData || {});
      }
    } catch (error) {
      console.error('Error fetching live stream data:', error);
    }
  }, []);

  const resetForm = useCallback(() => setFormData({
    username: '',
    twitch_username: '',
    display_name: '',
    avatar_url: '',
    is_active: true
  }), []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingStreamer(null);
    resetForm();
  }, [resetForm]);

  // CRUD HANDLERS
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (!formData.username.trim() || !formData.twitch_username.trim()) {
      toast({ title: "Error", description: "Username and Twitch username are required", variant: "destructive" });
      return;
    }
    
    try {
      const streamDataObj = {
        username: formData.username.trim(),
        twitch_username: formData.twitch_username.trim(),
        display_name: formData.display_name.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
        is_active: formData.is_active,
        order_index: editingStreamer ? editingStreamer.order_index : streamers.length,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      console.log('Attempting to save streamer:', streamDataObj);
      console.log('Editing streamer?', !!editingStreamer);
      
      if (editingStreamer) {
        const { error } = await supabase.from('twitch_streamers').update(streamDataObj).eq('id', editingStreamer.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: "Success", description: "Streamer updated successfully" });
      } else {
        const { data, error } = await supabase.from('twitch_streamers').insert(streamDataObj);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Streamer added successfully:', data);
        toast({ title: "Success", description: "Streamer added successfully" });
      }
      
      handleDialogClose();
      await fetchStreamers();
      await fetchStreamData();
    } catch (error: any) {
      console.error('Error saving streamer:', error);
      toast({ title: "Error", description: error.message || "Failed to save streamer", variant: "destructive" });
    }
  }, [formData, editingStreamer, streamers.length, toast, handleDialogClose, fetchStreamers, fetchStreamData]);

  const handleEdit = useCallback((streamer: TwitchStreamer) => {
    setEditingStreamer(streamer);
    setFormData({
      username: streamer.username,
      twitch_username: streamer.twitch_username,
      display_name: streamer.display_name || '',
      avatar_url: streamer.avatar_url || '',
      is_active: streamer.is_active
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (streamerId: string) => {
    try {
      const { error } = await supabase.from('twitch_streamers').delete().eq('id', streamerId);
      if (error) throw error;
      toast({ title: "Success", description: "Streamer deleted successfully" });
      fetchStreamers();
      fetchStreamData();
    } catch (error: any) {
      console.error('Error deleting streamer:', error);
      toast({ title: "Error", description: error.message || "Failed to delete streamer", variant: "destructive" });
    }
  }, [fetchStreamers, fetchStreamData, toast]);

  const toggleActive = useCallback(async (streamerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('twitch_streamers').update({ is_active: isActive }).eq('id', streamerId);
      if (error) throw error;
      toast({ title: "Success", description: `Streamer ${isActive ? 'activated' : 'deactivated'} successfully` });
      fetchStreamers();
      fetchStreamData();
    } catch (error: any) {
      console.error('Error updating streamer status:', error);
      toast({ title: "Error", description: error.message || "Failed to update streamer status", variant: "destructive" });
    }
  }, [fetchStreamers, fetchStreamData, toast]);

  // DRAG HANDLE ORDER UPDATE
  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = streamers.findIndex((s) => s.id === active.id);
    const newIndex = streamers.findIndex((s) => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newStreamers = arrayMove(streamers, oldIndex, newIndex);
    
    // Update local state immediately for better UX
    setStreamers(newStreamers);
    
    try {
      // Update database in background
      await Promise.all(
        newStreamers.map((s, idx) =>
          supabase.from('twitch_streamers').update({ order_index: idx }).eq('id', s.id)
        )
      );
      toast({ title: "Order Updated", description: "Streamer order saved." });
    } catch (error) {
      console.error('Error updating order:', error);
      // Revert on error
      setStreamers(streamers);
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    }
  }, [streamers, toast]);

  if (loading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gaming-dark rounded w-1/4"></div>
          <div className="space-y-3">{[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gaming-dark rounded"></div>
          ))}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-neon-purple" />
          <h2 className="text-xl font-semibold text-foreground">Twitch Streamers</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              console.log('Add Streamer button clicked');
              setEditingStreamer(null); 
              resetForm(); 
              setIsDialogOpen(true); 
            }} className="bg-neon-purple hover:bg-neon-purple/80">
              <Plus className="h-4 w-4 mr-2" />
              Add Streamer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingStreamer ? 'Edit Streamer' : 'Add New Streamer'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingStreamer ? 'Update the streamer information.' : 'Add a new Twitch streamer to the live page.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              console.log('Form onSubmit triggered');
              handleSubmit(e);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Display username"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitch_username" className="text-foreground">Twitch Username</Label>
                  <Input
                    id="twitch_username"
                    value={formData.twitch_username}
                    onChange={(e) => setFormData({ ...formData, twitch_username: e.target.value })}
                    placeholder="twitch_username"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-foreground">Display Name (Optional)</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Custom display name"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="text-foreground">Avatar URL (Optional)</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                  type="url"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-foreground">Active</Label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/80">
                  {editingStreamer ? 'Update' : 'Add'} Streamer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* LIVE STREAM KORT */}
      <h2 className="text-lg font-semibold mb-4">Live Stream Previews</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {streamers
            .filter((s) => s.is_active)
            .map((streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                streamData={streamData[streamer.twitch_username] || {}}
              />
          ))}
      </div>
      {/* DRAG AND DROP ADMIN LIST */}
      <h2 className="text-lg font-semibold mb-2">Sort / Edit Streamers</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={streamers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {streamers.map((streamer) => (
            <SortableStreamerRow
              key={streamer.id}
              streamer={streamer}
              onEdit={handleEdit}
              onDelete={handleDelete}
              toggleActive={toggleActive}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Card>
  );
};

export default TwitchStreamersManager;
