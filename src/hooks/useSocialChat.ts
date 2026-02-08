import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface Room {
  id: string;
  name: string;
  is_group: boolean;
  invite_token?: string;
  created_at: string;
}

export interface TypingUser {
  userId: string;
  username: string;
}

export interface PresenceUser {
  user_id: string;
  online_at: string;
  username?: string;
}

export function useSocialChat(roomId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!roomId || !userId) return;

    fetchMessages();

    // Create channel for room
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } }
    });

    // Subscribe to new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // Fetch user profile for new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const newMessage: Message = {
          ...payload.new as Message,
          profiles: profile || undefined,
        };

        setMessages(prev => [...prev, newMessage]);
      }
    );

    // Subscribe to typing indicator broadcasts
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId !== userId) {
        if (payload.isTyping) {
          setTypingUsers(prev => {
            if (!prev.find(u => u.userId === payload.userId)) {
              return [...prev, { userId: payload.userId, username: payload.username }];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== payload.userId));
        }
      }
    });

    // Subscribe to presence (online status)
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users: PresenceUser[] = [];
      
      Object.keys(presenceState).forEach(key => {
        const presences = presenceState[key] as any[];
        presences.forEach(presence => {
          users.push({
            user_id: presence.user_id,
            online_at: presence.online_at,
            username: presence.username,
          });
        });
      });

      setOnlineUsers(users);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Get current user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();

        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          username: profile?.username || 'User',
        });
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, fetchMessages]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!roomId || !userId || !content.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [roomId, userId]);

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean, username: string) => {
    if (!channelRef.current || !userId) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, username, isTyping },
    });
  }, [userId]);

  return {
    messages,
    typingUsers,
    onlineUsers,
    loading,
    sendMessage,
    setTyping,
    refreshMessages: fetchMessages,
  };
}

// Hook to get/create rooms
export function useRooms(userId: string | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (id, name, is_group, created_at)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const roomList = (data || [])
        .map(rm => rm.rooms as unknown as Room)
        .filter(Boolean);

      setRooms(roomList);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createRoom = useCallback(async (name: string, isGroup: boolean = false) => {
    if (!userId) return null;

    try {
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({ name, is_group: isGroup, created_by: userId })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({ room_id: room.id, user_id: userId, role: 'admin' });

      if (memberError) throw memberError;

      await fetchRooms();
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }, [userId, fetchRooms]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: userId });

      if (error) throw error;

      await fetchRooms();
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  }, [userId, fetchRooms]);

  const joinRoomByToken = useCallback(async (token: string): Promise<{ success: boolean; error?: string; roomName?: string }> => {
    if (!userId) return { success: false, error: 'User not logged in' };

    try {
      const { data, error } = await supabase.rpc('join_room_by_token', { token: token.trim().toLowerCase() });

      if (error) throw error;

      if (data?.success) {
        await fetchRooms();
        return { success: true, roomName: data.room_name };
      } else {
        return { success: false, error: data?.error || 'Gagal bergabung' };
      }
    } catch (error: any) {
      console.error('Error joining room by token:', error);
      return { success: false, error: error.message || 'Gagal bergabung ke room' };
    }
  }, [userId, fetchRooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    joinRoomByToken,
    refreshRooms: fetchRooms,
  };
}
