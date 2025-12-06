// app/chat/features/MessageReply/ReplyPreview.tsx
import React from 'react';
import { X, MessageSquare } from 'lucide-react';

interface ReplyPreviewProps {
  replyTo: {
    messageId: string;
    text: string;
    senderId: string;
    senderName: string;
  };
  onCancel: () => void;
  currentUserId: string;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyTo,
  onCancel,
  currentUserId
}) => {
  const isOwnReply = replyTo.senderId === currentUserId;

  return (
    <div className="px-4 py-2 border-l-4 border-blue-500 bg-blue-50 rounded-lg mx-4 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 mb-1">
          <MessageSquare size={14} className="text-blue-500" />
          <span className="text-sm font-medium text-blue-700">
            Replying to {isOwnReply ? 'yourself' : replyTo.senderName}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-blue-100 rounded-full transition-colors"
        >
          <X size={14} className="text-blue-500" />
        </button>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 pl-6">
        {replyTo.text}
      </p>
    </div>
  );
};

export default ReplyPreview;