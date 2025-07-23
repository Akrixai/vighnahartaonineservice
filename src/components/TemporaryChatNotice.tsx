'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function TemporaryChatNotice() {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-800">Chat System Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Our real-time chat system is currently active. You can connect with our support team for immediate assistance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
