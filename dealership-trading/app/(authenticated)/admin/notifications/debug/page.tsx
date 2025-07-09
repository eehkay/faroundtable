'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NotificationDebugPage() {
  const [template, setTemplate] = useState('Transfer from {{transfer.from_location.name}} to {{transfer.to_location.name}} requested by {{transfer.requested_by.name}}');
  const [transferId, setTransferId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/debug-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, transferId, vehicleId })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Debug error:', error);
      setResult({ error: 'Failed to debug template' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Notification Template Debugger</CardTitle>
          <CardDescription>
            Test template processing with real data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Template</Label>
            <Textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
              className="font-mono text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="transferId">Transfer ID (optional)</Label>
            <Input
              id="transferId"
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            />
          </div>
          
          <div>
            <Label htmlFor="vehicleId">Vehicle ID (optional)</Label>
            <Input
              id="vehicleId"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            />
          </div>
          
          <Button onClick={handleDebug} disabled={loading}>
            {loading ? 'Processing...' : 'Debug Template'}
          </Button>
          
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Processed Result:</h3>
                <p className="font-mono text-sm whitespace-pre-wrap">{result.processed || 'N/A'}</p>
              </div>
              
              <div className="p-4 bg-gray-900 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
              
              {result.error && (
                <div className="p-4 bg-red-900/20 rounded-lg">
                  <p className="text-red-400">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}