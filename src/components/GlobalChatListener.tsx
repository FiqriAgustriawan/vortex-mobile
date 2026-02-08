import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRooms } from '../hooks/useSocialChat';
import { showLocalNotification } from '../services/notifications';

export function GlobalChatListener() {
  const { user } = useAuth();
  const { rooms, refreshRooms } = useRooms(user?.id || null);
  const roomsRef = useRef(rooms);

  // Keep ref updated
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Periodic refresh of rooms to ensure we have latest list
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshRooms();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user, refreshRooms]);

  useEffect(() => {
    if (!user) return;

    console.log('🎧 GlobalChatListener: Subscribing to messages...');

    const channel = supabase.channel('global_messages');

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        try {
          const newMessage = payload.new;
          if (!newMessage || newMessage.user_id === user.id) return;

          // Check if we are member of this room
          // We use the ID from the payload directly to check against our list
          const isMember = roomsRef.current.find(r => r.id === newMessage.room_id);

          // Debug log
          // console.log('📨 New Message:', { id: newMessage.id, room: newMessage.room_id, isMember: !!isMember });

          if (!isMember) return;

          // Check content for Digest
          if (newMessage.content && newMessage.content.startsWith('📰 DIGEST:')) {
            await showLocalNotification(
              'News Digest Ready! 📰',
              `Digest baru di ${isMember.name} sudah siap.`,
              { type: 'digest', roomId: newMessage.room_id, digestId: newMessage.id }
            );
            return;
          }

          // Fetch sender name
          const { data: sender } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMessage.user_id)
            .single();

          const senderName = sender?.username || 'Someone';

          // Show notification
          await showLocalNotification(
            senderName,
            newMessage.content,
            { type: 'chat', roomId: newMessage.room_id, screen: 'socialChat' }
          );
        } catch (error) {
          console.error('Error handling notification:', error);
        }
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
